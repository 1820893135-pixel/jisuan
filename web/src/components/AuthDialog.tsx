import { Eye, EyeOff, LogIn, RefreshCw, ShieldCheck, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { travelApi } from '../api'
import {
  getPasswordVisibilityToggleMeta,
  getRegisterPasswordMatchError,
  getRegisterPasswordValidationErrors,
  getRegisterUsernameHint,
} from '../lib/authValidation'
import { useTravelApp } from '../context/useTravelApp'

function buildCaptchaSrc(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function AuthDialog() {
  const {
    authBusy,
    authCaptcha,
    authCaptchaLoading,
    authDialogOpen,
    authForm,
    authMode,
    closeAuthDialog,
    error,
    handleAuthSubmit,
    refreshAuthCaptcha,
    setAuthField,
    setAuthMode,
  } = useTravelApp()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [usernameHint, setUsernameHint] = useState('')

  useEffect(() => {
    if (!authDialogOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAuthDialog()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [authDialogOpen, closeAuthDialog])

  useEffect(() => {
    if (!authDialogOpen) {
      setShowPassword(false)
      setShowConfirmPassword(false)
      setUsernameHint('')
    }
  }, [authDialogOpen])

  useEffect(() => {
    if (authMode !== 'register') {
      setShowConfirmPassword(false)
      setUsernameHint('')
    }
  }, [authMode])

  useEffect(() => {
    if (!authDialogOpen || authMode !== 'register') {
      setUsernameHint('')
      return
    }

    const username = authForm.username.trim()

    if (username.length < 3) {
      setUsernameHint('')
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const availability = await travelApi.checkUsernameAvailability(username)

        if (!cancelled) {
          setUsernameHint(getRegisterUsernameHint(username, availability))
        }
      } catch {
        if (!cancelled) {
          setUsernameHint('')
        }
      }
    }, 320)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [authDialogOpen, authMode, authForm.username])

  if (!authDialogOpen) {
    return null
  }

  const title = authMode === 'login' ? '登录账号' : '注册账号'
  const subtitle =
    authMode === 'login'
      ? '登录后可同步收藏点位、保留行程偏好，并继续使用地图导览。'
      : '创建账号后可跨设备保存收藏景点和路线偏好。'
  const registerPasswordErrors =
    authMode === 'register' ? getRegisterPasswordValidationErrors(authForm.password) : []
  const registerPasswordHint =
    authMode !== 'register'
      ? ''
      : authForm.password
        ? registerPasswordErrors[0] ?? '当前密码强度符合要求，可用于注册。'
        : '注册密码需为 12-72 位，且包含大小写字母、数字和特殊字符，不支持空格。'
  const confirmPasswordHint =
    authMode !== 'register'
      ? ''
      : authForm.confirmPassword
        ? getRegisterPasswordMatchError(authForm.password, authForm.confirmPassword) ||
          '两次输入一致，可以继续注册。'
        : '请再次输入一次相同密码，注册时会校验两次输入是否一致。'
  const passwordVisibilityToggle = getPasswordVisibilityToggleMeta(showPassword)
  const confirmPasswordVisibilityToggle = getPasswordVisibilityToggleMeta(showConfirmPassword)

  return (
    <div
      aria-hidden="true"
      className="auth-dialog-backdrop"
      onClick={closeAuthDialog}
      role="presentation"
    >
      <div
        aria-labelledby="auth-dialog-title"
        aria-modal="true"
        className="auth-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="auth-dialog__header">
          <div>
            <span className="auth-dialog__eyebrow">账号中心</span>
            <h2 id="auth-dialog-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            aria-label="关闭登录注册弹层"
            className="icon-button button-secondary"
            onClick={closeAuthDialog}
            type="button"
          >
            <X className="icon-5" />
          </button>
        </div>

        <div className="auth-dialog__mode-switch">
          <button
            className={authMode === 'login' ? 'chip-button active' : 'chip-button'}
            onClick={() => setAuthMode('login')}
            type="button"
          >
            <LogIn className="icon-4" />
            登录
          </button>
          <button
            className={authMode === 'register' ? 'chip-button active' : 'chip-button'}
            onClick={() => setAuthMode('register')}
            type="button"
          >
            <UserPlus className="icon-4" />
            注册
          </button>
        </div>

        <form
          className="auth-dialog__form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleAuthSubmit()
          }}
        >
          <label className="auth-field">
            <span>用户名</span>
            <input
              autoComplete="username"
              onChange={(event) => setAuthField('username', event.target.value)}
              placeholder="请输入用户名"
              type="text"
              value={authForm.username}
            />
            {authMode === 'register' && usernameHint ? (
              <small className="auth-field__hint auth-field__hint--warning">{usernameHint}</small>
            ) : null}
          </label>

          <label className="auth-field">
            <span>密码</span>
            <div className="auth-field__input-wrap">
              <input
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                onChange={(event) => setAuthField('password', event.target.value)}
                placeholder={authMode === 'login' ? '请输入登录密码' : '请输入 12-72 位高强度密码'}
                type={passwordVisibilityToggle.inputType}
                value={authForm.password}
              />
              <button
                aria-label={passwordVisibilityToggle.label}
                className="auth-field__toggle"
                onClick={() => setShowPassword((current) => !current)}
                title={passwordVisibilityToggle.label}
                type="button"
              >
                {showPassword ? <EyeOff className="icon-4" /> : <Eye className="icon-4" />}
                <small className="auth-field__toggle-text">{showPassword ? '隐藏' : '显示'}</small>
              </button>
            </div>
            {authMode === 'register' ? (
              <small className="auth-field__hint">{registerPasswordHint}</small>
            ) : null}
          </label>

          {authMode === 'register' ? (
            <label className="auth-field">
              <span>确认密码</span>
              <div className="auth-field__input-wrap">
                <input
                  autoComplete="new-password"
                  onChange={(event) => setAuthField('confirmPassword', event.target.value)}
                  placeholder="请再次输入相同密码"
                  type={confirmPasswordVisibilityToggle.inputType}
                  value={authForm.confirmPassword}
                />
                <button
                  aria-label={confirmPasswordVisibilityToggle.label}
                  className="auth-field__toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  title={confirmPasswordVisibilityToggle.label}
                  type="button"
                >
                  {showConfirmPassword ? <EyeOff className="icon-4" /> : <Eye className="icon-4" />}
                  <small className="auth-field__toggle-text">
                    {showConfirmPassword ? '隐藏' : '显示'}
                  </small>
                </button>
              </div>
              <small className="auth-field__hint">{confirmPasswordHint}</small>
            </label>
          ) : null}

          <div className="auth-field auth-field--captcha">
            <label>
              <span>验证码</span>
              <input
                autoComplete="off"
                inputMode="text"
                maxLength={8}
                onChange={(event) => setAuthField('captchaCode', event.target.value.toUpperCase())}
                placeholder="输入图中字符"
                type="text"
                value={authForm.captchaCode}
              />
            </label>

            <div className="auth-captcha">
              <div className="auth-captcha__image">
                {authCaptcha ? (
                  <img alt="验证码" src={buildCaptchaSrc(authCaptcha.svg)} />
                ) : (
                  <div className="auth-captcha__placeholder">
                    {authCaptchaLoading ? '正在生成验证码...' : '验证码加载失败'}
                  </div>
                )}
              </div>

              <button
                className="button-secondary auth-captcha__refresh"
                disabled={authCaptchaLoading}
                onClick={() => void refreshAuthCaptcha()}
                type="button"
              >
                <RefreshCw className="icon-4" />
                换一张
              </button>
            </div>

            <small className="auth-field__hint">
              {authCaptcha
                ? `${Math.max(1, Math.floor(authCaptcha.expiresInSeconds / 60))} 分钟内有效，提交后会自动失效。`
                : '验证码由服务端生成，用于防止批量注册和撞库请求。'}
            </small>
          </div>

          {error ? <div className="notice notice--error auth-dialog__notice">{error}</div> : null}

          <div className="auth-dialog__actions">
            <button className="button-primary" disabled={authBusy || authCaptchaLoading} type="submit">
              <ShieldCheck className="icon-5" />
              {authBusy ? '提交中...' : authMode === 'login' ? '登录并同步' : '注册并开始使用'}
            </button>

            <button className="button-secondary" onClick={closeAuthDialog} type="button">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
