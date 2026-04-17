import { Router } from 'express'
import { z } from 'zod'
import { signAuthToken } from '../lib/auth.js'
import { createCaptchaChallenge, verifyCaptcha } from '../lib/captcha.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { requireAuth } from '../middleware/auth.js'
import { createUser, findUserById, findUserByUsername } from '../repositories/users.js'

const credentialsSchema = z.object({
  captchaCode: z.string().trim().min(4).max(8),
  captchaId: z.string().trim().min(1),
  username: z
    .string()
    .trim()
    .min(3, '用户名至少需要 3 个字符')
    .max(24, '用户名最多 24 个字符')
    .regex(/^[\w\u4E00-\u9FFF-]+$/u, '用户名仅支持中英文、数字、下划线和连字符'),
  password: z
    .string()
    .min(8, '密码至少需要 8 位')
    .max(72, '密码不能超过 72 位'),
})

export const authRouter = Router()

authRouter.get(
  '/auth/captcha',
  asyncRoute(async (_request, response) => {
    response.json(createCaptchaChallenge())
  }),
)

authRouter.post(
  '/auth/register',
  asyncRoute(async (request, response) => {
    const result = credentialsSchema.safeParse(request.body)

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
      throw new HttpError(409, '用户名已存在，请换一个再试')
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
    const result = credentialsSchema.safeParse(request.body)

    if (!result.success) {
      throw new HttpError(
        400,
        getCredentialsValidationMessage(result.error.flatten().fieldErrors),
        result.error.flatten(),
      )
    }

    assertCaptcha(result.data.captchaId, result.data.captchaCode)

    const existingUser = findUserByUsername(result.data.username)

    if (!existingUser || !verifyPassword(result.data.password, existingUser.passwordHash)) {
      throw new HttpError(401, '用户名或密码错误')
    }

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

function assertCaptcha(captchaId: string, captchaCode: string) {
  if (!verifyCaptcha(captchaId, captchaCode)) {
    throw new HttpError(400, '输入验证码不正确，请重新输入')
  }
}

function getCredentialsValidationMessage(fieldErrors: {
  captchaCode?: string[]
  captchaId?: string[]
  password?: string[]
  username?: string[]
}) {
  if (fieldErrors.captchaCode?.length || fieldErrors.captchaId?.length) {
    return '请输入验证码并确认填写正确'
  }

  if (fieldErrors.username?.length && fieldErrors.password?.length) {
    return '用户名或密码不符合要求'
  }

  if (fieldErrors.username?.length) {
    return fieldErrors.username[0] ?? '用户名不符合要求'
  }

  if (fieldErrors.password?.length) {
    return fieldErrors.password[0] ?? '密码不符合要求'
  }

  return '输入信息不符合要求，请检查后重试'
}
