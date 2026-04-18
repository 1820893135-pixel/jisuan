import type { UsernameAvailability } from '../types'

type AuthMode = 'login' | 'register'

interface AuthFields {
  captchaCode: string
  captchaId: string
  confirmPassword: string
  password: string
  username: string
}

interface PasswordChangeFields {
  confirmPassword: string
  currentPassword: string
  newPassword: string
}

const PASSWORD_MIN_LENGTH = 12
const PASSWORD_MAX_LENGTH = 72
const USERNAME_PATTERN = /^[\w\u4E00-\u9FFF-]+$/u

export function getRegisterPasswordValidationErrors(password: string) {
  const errors: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`密码长度需为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`)
  }

  if (/\s/.test(password)) {
    errors.push('密码不能包含空格')
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecialCharacter = /[^A-Za-z0-9\s]/.test(password)

  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialCharacter) {
    errors.push('密码需同时包含大写字母、小写字母、数字和特殊字符')
  }

  return errors
}

export function getRegisterPasswordMatchError(password: string, confirmPassword: string) {
  if (!confirmPassword.trim()) {
    return '请再次输入密码以完成确认'
  }

  if (password !== confirmPassword) {
    return '两次输入的密码不一致'
  }

  return ''
}

export function getRegisterUsernameHint(
  username: string,
  availability: UsernameAvailability | null,
) {
  if (!username.trim() || !availability || availability.available) {
    return ''
  }

  if (availability.suggestions.length === 0) {
    return '该用户名已被使用，请换一个用户名。'
  }

  return `该用户名已被使用，可以试试：${availability.suggestions.join('、')}`
}

export function getPasswordVisibilityToggleMeta(isVisible: boolean) {
  return {
    inputType: isVisible ? 'text' : 'password',
    label: isVisible ? '隐藏密码' : '显示密码',
  } as const
}

export function getProfileUsernameValidationMessage(currentUsername: string, nextUsername: string) {
  const normalizedUsername = nextUsername.trim()

  if (!normalizedUsername) {
    return '请输入新的用户名'
  }

  if (normalizedUsername === currentUsername.trim()) {
    return '用户名还没有发生变化'
  }

  if (normalizedUsername.length < 3) {
    return '用户名至少需要 3 个字符'
  }

  if (normalizedUsername.length > 24) {
    return '用户名最多支持 24 个字符'
  }

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return '用户名仅支持中文、英文、数字、下划线和连字符'
  }

  return ''
}

export function getPasswordChangeValidationMessage(fields: PasswordChangeFields) {
  if (!fields.currentPassword.trim()) {
    return '请输入当前密码后再继续'
  }

  if (!fields.newPassword.trim()) {
    return '请输入新密码后再继续'
  }

  if (fields.currentPassword === fields.newPassword) {
    return '新密码不能与当前密码相同'
  }

  const passwordErrors = getRegisterPasswordValidationErrors(fields.newPassword)

  if (passwordErrors.length > 0) {
    return passwordErrors[0] ?? '密码不符合要求'
  }

  return getRegisterPasswordMatchError(fields.newPassword, fields.confirmPassword)
}

export function getAuthSubmitValidationMessage(mode: AuthMode, fields: AuthFields) {
  if (!fields.username.trim() || !fields.password.trim()) {
    return '请输入用户名和密码后再继续。'
  }

  if (mode === 'register') {
    const passwordErrors = getRegisterPasswordValidationErrors(fields.password)

    if (passwordErrors.length > 0) {
      return passwordErrors[0] ?? '密码不符合要求'
    }

    const passwordMatchError = getRegisterPasswordMatchError(fields.password, fields.confirmPassword)

    if (passwordMatchError) {
      return passwordMatchError
    }
  }

  if (!fields.captchaCode.trim() || !fields.captchaId) {
    return '请输入验证码后再继续。'
  }

  return ''
}
