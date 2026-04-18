export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 72

const PASSWORD_COMPLEXITY_MESSAGE = '密码需同时包含大写字母、小写字母、数字和特殊字符'
const PASSWORD_LENGTH_MESSAGE = `密码长度需为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`
const PASSWORD_WHITESPACE_MESSAGE = '密码不能包含空格'

export function getPasswordValidationErrors(password: string) {
  const errors: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(PASSWORD_LENGTH_MESSAGE)
  }

  if (/\s/.test(password)) {
    errors.push(PASSWORD_WHITESPACE_MESSAGE)
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecialCharacter = /[^A-Za-z0-9\s]/.test(password)

  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialCharacter) {
    errors.push(PASSWORD_COMPLEXITY_MESSAGE)
  }

  return errors
}

export function getPasswordConfirmationError(password: string, confirmPassword: string) {
  if (password !== confirmPassword) {
    return '两次输入的密码不一致'
  }

  return null
}

export function isPasswordStrongEnough(password: string) {
  return getPasswordValidationErrors(password).length === 0
}
