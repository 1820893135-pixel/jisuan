import { type Request, Router } from 'express'
import { z } from 'zod'
import { signAuthToken } from '../lib/auth.js'
import { createCaptchaChallenge, verifyCaptcha } from '../lib/captcha.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import { LoginAttemptLimiter } from '../lib/loginAttemptLimiter.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import {
  getPasswordConfirmationError,
  getPasswordValidationErrors,
} from '../lib/passwordPolicy.js'
import { getUsernameAvailabilityResult } from '../lib/usernameAvailability.js'
import { requireAuth } from '../middleware/auth.js'
import {
  createUser,
  findUserAuthById,
  findUserById,
  findUserByUsername,
  updatePasswordHashById,
  updateUsernameById,
} from '../repositories/users.js'

const usernameSchema = z
  .string()
  .trim()
  .min(3, '用户名至少需要 3 个字符')
  .max(24, '用户名最多支持 24 个字符')
  .regex(/^[\w\u4E00-\u9FFF-]+$/u, '用户名仅支持中文、英文、数字、下划线和连字符')

const captchaSchema = z.object({
  captchaCode: z.string().trim().min(4).max(8),
  captchaId: z.string().trim().min(1),
  username: usernameSchema,
})

const registerCredentialsSchema = captchaSchema
  .extend({
    confirmPassword: z.string().trim().min(1, '请再次输入密码以完成确认'),
    password: z.string(),
  })
  .superRefine((value, context) => {
    for (const message of getPasswordValidationErrors(value.password)) {
      context.addIssue({
        code: 'custom',
        message,
        path: ['password'],
      })
    }

    const passwordConfirmationError = getPasswordConfirmationError(
      value.password,
      value.confirmPassword,
    )

    if (passwordConfirmationError) {
      context.addIssue({
        code: 'custom',
        message: passwordConfirmationError,
        path: ['confirmPassword'],
      })
    }
  })

const loginCredentialsSchema = captchaSchema.extend({
  password: z.string().min(8, '密码至少需要 8 位').max(72, '密码不能超过 72 位'),
})

const profileUpdateSchema = z.object({
  username: usernameSchema,
})

const passwordUpdateSchema = z
  .object({
    confirmPassword: z.string().trim().min(1, '请再次输入新密码以完成确认'),
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string(),
  })
  .superRefine((value, context) => {
    for (const message of getPasswordValidationErrors(value.newPassword)) {
      context.addIssue({
        code: 'custom',
        message,
        path: ['newPassword'],
      })
    }

    const passwordConfirmationError = getPasswordConfirmationError(
      value.newPassword,
      value.confirmPassword,
    )

    if (passwordConfirmationError) {
      context.addIssue({
        code: 'custom',
        message: passwordConfirmationError,
        path: ['confirmPassword'],
      })
    }
  })

const loginAttemptLimiter = new LoginAttemptLimiter({
  failureWindowMs: 10 * 60 * 1000,
  lockoutMs: 10 * 60 * 1000,
  maxFailures: 5,
})

export const authRouter = Router()

authRouter.get(
  '/auth/captcha',
  asyncRoute(async (_request, response) => {
    response.json(createCaptchaChallenge())
  }),
)

authRouter.get(
  '/auth/username-availability',
  asyncRoute(async (request, response) => {
    const result = usernameSchema.safeParse(request.query.username)

    if (!result.success) {
      throw new HttpError(400, result.error.issues[0]?.message ?? '用户名不符合要求')
    }

    response.json(
      getUsernameAvailabilityResult(result.data, (candidate) =>
        Boolean(findUserByUsername(candidate)),
      ),
    )
  }),
)

authRouter.post(
  '/auth/register',
  asyncRoute(async (request, response) => {
    const result = registerCredentialsSchema.safeParse(request.body)

    if (!result.success) {
      throw new HttpError(
        400,
        getCredentialsValidationMessage(result.error.flatten().fieldErrors),
        result.error.flatten(),
      )
    }

    assertCaptcha(result.data.captchaId, result.data.captchaCode)

    const existingUser = findUserByUsername(result.data.username)

    if (existingUser) {
      throw new HttpError(409, '用户名已存在，请更换后再试')
    }

    const user = createUser(result.data.username, hashPassword(result.data.password))

    response.status(201).json({
      user,
      token: signAuthToken(user),
    })
  }),
)

authRouter.post(
  '/auth/login',
  asyncRoute(async (request, response) => {
    const result = loginCredentialsSchema.safeParse(request.body)

    if (!result.success) {
      throw new HttpError(
        400,
        getCredentialsValidationMessage(result.error.flatten().fieldErrors),
        result.error.flatten(),
      )
    }

    assertCaptcha(result.data.captchaId, result.data.captchaCode)

    const loginAttemptKey = getLoginAttemptKey(request, result.data.username)
    const attemptStatus = loginAttemptLimiter.getStatus(loginAttemptKey)

    if (!attemptStatus.allowed) {
      throw new HttpError(429, getLoginLockMessage(attemptStatus.retryAfterMs))
    }

    const existingUser = findUserByUsername(result.data.username)

    if (!existingUser || !verifyPassword(result.data.password, existingUser.passwordHash)) {
      const nextAttemptStatus = loginAttemptLimiter.recordFailure(loginAttemptKey)

      if (!nextAttemptStatus.allowed) {
        throw new HttpError(429, getLoginLockMessage(nextAttemptStatus.retryAfterMs))
      }

      throw new HttpError(401, '用户名或密码错误')
    }

    loginAttemptLimiter.clear(loginAttemptKey)

    response.json({
      user: existingUser.user,
      token: signAuthToken(existingUser.user),
    })
  }),
)

authRouter.get(
  '/auth/me',
  requireAuth,
  asyncRoute(async (request, response) => {
    const user = findUserById(request.authUser!.id)

    if (!user) {
      throw new HttpError(404, '用户不存在')
    }

    response.json({ user })
  }),
)

authRouter.patch(
  '/auth/profile',
  requireAuth,
  asyncRoute(async (request, response) => {
    const result = profileUpdateSchema.safeParse(request.body)

    if (!result.success) {
      throw new HttpError(
        400,
        getProfileValidationMessage(result.error.flatten().fieldErrors),
        result.error.flatten(),
      )
    }

    const authUser = findUserById(request.authUser!.id)

    if (!authUser) {
      throw new HttpError(404, '用户不存在')
    }

    const existingUser = findUserByUsername(result.data.username)

    if (existingUser && existingUser.user.id !== authUser.id) {
      throw new HttpError(409, '用户名已存在，请更换后再试')
    }

    const updatedUser = updateUsernameById(authUser.id, result.data.username)

    if (!updatedUser) {
      throw new HttpError(404, '用户不存在')
    }

    response.json({
      token: signAuthToken(updatedUser),
      user: updatedUser,
    })
  }),
)

authRouter.patch(
  '/auth/password',
  requireAuth,
  asyncRoute(async (request, response) => {
    const result = passwordUpdateSchema.safeParse(request.body)

    if (!result.success) {
      throw new HttpError(
        400,
        getPasswordUpdateValidationMessage(result.error.flatten().fieldErrors),
        result.error.flatten(),
      )
    }

    const authUser = findUserAuthById(request.authUser!.id)

    if (!authUser) {
      throw new HttpError(404, '用户不存在')
    }

    if (!verifyPassword(result.data.currentPassword, authUser.passwordHash)) {
      throw new HttpError(401, '当前密码不正确')
    }

    if (verifyPassword(result.data.newPassword, authUser.passwordHash)) {
      throw new HttpError(400, '新密码不能与当前密码相同')
    }

    updatePasswordHashById(authUser.user.id, hashPassword(result.data.newPassword))

    response.json({
      success: true,
    })
  }),
)

function assertCaptcha(captchaId: string, captchaCode: string) {
  if (!verifyCaptcha(captchaId, captchaCode)) {
    throw new HttpError(400, '输入验证码不正确，请重新输入')
  }
}

function getLoginAttemptKey(request: Request, username: string) {
  return `${request.ip ?? 'unknown-ip'}:${username.trim().toLowerCase()}`
}

function getLoginLockMessage(retryAfterMs: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000))
  return `登录失败次数过多，请在 ${minutes} 分钟后再试`
}

function getCredentialsValidationMessage(fieldErrors: {
  captchaCode?: string[]
  captchaId?: string[]
  confirmPassword?: string[]
  password?: string[]
  username?: string[]
}) {
  if (fieldErrors.captchaCode?.length || fieldErrors.captchaId?.length) {
    return '请输入验证码并确认填写正确'
  }

  if (fieldErrors.username?.length) {
    return fieldErrors.username[0] ?? '用户名不符合要求'
  }

  if (fieldErrors.password?.length) {
    return fieldErrors.password[0] ?? '密码不符合要求'
  }

  if (fieldErrors.confirmPassword?.length) {
    return fieldErrors.confirmPassword[0] ?? '两次输入的密码不一致'
  }

  return '输入信息不符合要求，请检查后重试'
}

function getProfileValidationMessage(fieldErrors: {
  username?: string[]
}) {
  if (fieldErrors.username?.length) {
    return fieldErrors.username[0] ?? '用户名不符合要求'
  }

  return '输入信息不符合要求，请检查后重试'
}

function getPasswordUpdateValidationMessage(fieldErrors: {
  confirmPassword?: string[]
  currentPassword?: string[]
  newPassword?: string[]
}) {
  if (fieldErrors.currentPassword?.length) {
    return fieldErrors.currentPassword[0] ?? '请输入当前密码'
  }

  if (fieldErrors.newPassword?.length) {
    return fieldErrors.newPassword[0] ?? '新密码不符合要求'
  }

  if (fieldErrors.confirmPassword?.length) {
    return fieldErrors.confirmPassword[0] ?? '两次输入的密码不一致'
  }

  return '输入信息不符合要求，请检查后重试'
}
