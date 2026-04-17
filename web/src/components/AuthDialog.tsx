import { LogIn, RefreshCw, ShieldCheck, UserPlus, X } from 'lucide-react'
import { useEffect } from 'react'
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

  if (!authDialogOpen) {
    return null
  }

  const title = authMode === 'login' ? '登录账号' : '注册账号'
  const subtitle =
    authMode === 'login'
      ? '登录后可同步收藏点位、保留行程偏好，并继续使用地图导览。'
      : '创建账号后可跨设备保存收藏景点和路线偏好。'

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
          </label>

          <label className="auth-field">
            <span>密码</span>
            <input
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              onChange={(event) => setAuthField('password', event.target.value)}
              placeholder="请输入至少 8 位密码"
              type="password"
              value={authForm.password}
            />
          </label>

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
