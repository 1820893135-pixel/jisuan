import { CalendarDays, Heart, LogIn, MapPinned, RefreshCw, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTravelApp } from '../context/useTravelApp'
import {
  getPasswordChangeValidationMessage,
  getProfileUsernameValidationMessage,
} from '../lib/authValidation'

type ProfileFeedback = {
  text: string
  tone: 'error' | 'success'
} | null

const emptyPasswordForm = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
}

function formatHistoryTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function ProfilePage() {
  const {
    favoriteBusyPoiId,
    favorites,
    handleProfilePasswordUpdate,
    handleProfileUsernameUpdate,
    handleRemoveFavorite,
    itineraryHistory,
    restoreItineraryHistory,
    user,
  } = useTravelApp()
  const [usernameForm, setUsernameForm] = useState('')
  const [usernameBusy, setUsernameBusy] = useState(false)
  const [usernameFeedback, setUsernameFeedback] = useState<ProfileFeedback>(null)
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<ProfileFeedback>(null)

  useEffect(() => {
    setUsernameForm(user?.username ?? '')
    setUsernameFeedback(null)
    setPasswordForm(emptyPasswordForm)
    setPasswordFeedback(null)
  }, [user?.id, user?.username])

  async function handleUsernameSubmit() {
    if (!user) {
      return
    }

    const validationMessage = getProfileUsernameValidationMessage(user.username, usernameForm)
    if (validationMessage) {
      setUsernameFeedback({
        text: validationMessage,
        tone: 'error',
      })
      return
    }

    setUsernameBusy(true)
    setUsernameFeedback(null)

    try {
      const updatedUser = await handleProfileUsernameUpdate(usernameForm)
      setUsernameForm(updatedUser.username)
      setUsernameFeedback({
        text: '用户名已更新，页面展示会立即同步。',
        tone: 'success',
      })
    } catch (caughtError) {
      setUsernameFeedback({
        text: getActionMessage(caughtError),
        tone: 'error',
      })
    } finally {
      setUsernameBusy(false)
    }
  }

  async function handlePasswordSubmit() {
    const validationMessage = getPasswordChangeValidationMessage(passwordForm)
    if (validationMessage) {
      setPasswordFeedback({
        text: validationMessage,
        tone: 'error',
      })
      return
    }

    setPasswordBusy(true)
    setPasswordFeedback(null)

    try {
      await handleProfilePasswordUpdate(passwordForm)
      setPasswordForm(emptyPasswordForm)
      setPasswordFeedback({
        text: '密码已更新，下次登录请使用新密码。',
        tone: 'success',
      })
    } catch (caughtError) {
      setPasswordFeedback({
        text: getActionMessage(caughtError),
        tone: 'error',
      })
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <div className="screen-page profile-page">
      <section className="content-section profile-hero">
        <div className="section-header section-header--profile">
          <div>
            <span className="profile-kicker">个人中心</span>
            <h1>{user ? `${user.username} 的导览记录` : '个人中心'}</h1>
          </div>
        </div>

        {!user ? (
          <div className="profile-empty">
            <LogIn className="icon-6" />
            <strong>登录后即可使用个人中心</strong>
            <span>收藏景点、历史行程和后续规划都会保存在账号里。</span>
            <div className="profile-empty__actions">
              <Link className="button-primary" to="/auth/login?from=%2Fprofile">
                登录
              </Link>
              <Link className="button-secondary" to="/auth/register?from=%2Fprofile">
                注册
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {user ? (
        <section className="content-section profile-section">
          <div className="section-header">
            <div>
              <h2>账号设置</h2>
              <p className="profile-settings-intro">
                在这里更新展示名称与登录密码，导览记录、收藏景点和行程数据都会保留在当前账号下。
              </p>
            </div>
          </div>

          <div className="profile-settings-grid">
            <form
              className="profile-settings-card"
              onSubmit={(event) => {
                event.preventDefault()
                void handleUsernameSubmit()
              }}
            >
              <div className="profile-settings-card__header">
                <span className="profile-settings-card__eyebrow">资料信息</span>
                <h3>修改用户名</h3>
                <p>用于顶部导航和个人中心展示，可保留你的导览身份感。</p>
              </div>

              <div className="profile-settings-summary">
                <span>当前用户名</span>
                <strong>{user.username}</strong>
              </div>

              <label className="auth-field profile-settings-field">
                <span>新用户名</span>
                <input
                  autoComplete="username"
                  onChange={(event) => setUsernameForm(event.target.value)}
                  placeholder="请输入新的用户名"
                  type="text"
                  value={usernameForm}
                />
                <small className="auth-field__hint">支持中文、英文、数字、下划线和连字符。</small>
              </label>

              {usernameFeedback ? (
                <div
                  className={usernameFeedback.tone === 'error' ? 'notice notice--error' : 'notice notice--soft'}
                >
                  {usernameFeedback.text}
                </div>
              ) : null}

              <div className="profile-settings-card__actions">
                <button className="button-primary" disabled={usernameBusy} type="submit">
                  <UserRound className="icon-4" />
                  {usernameBusy ? '保存中…' : '保存用户名'}
                </button>
              </div>
            </form>

            <form
              className="profile-settings-card"
              onSubmit={(event) => {
                event.preventDefault()
                void handlePasswordSubmit()
              }}
            >
              <div className="profile-settings-card__header">
                <span className="profile-settings-card__eyebrow">安全设置</span>
                <h3>修改密码</h3>
                <p>更新后当前登录状态会保留，但下次登录需要使用新密码。</p>
              </div>

              <label className="auth-field profile-settings-field">
                <span>当前密码</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder="请输入当前密码"
                  type="password"
                  value={passwordForm.currentPassword}
                />
              </label>

              <label className="auth-field profile-settings-field">
                <span>新密码</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  placeholder="请输入新的高强度密码"
                  type="password"
                  value={passwordForm.newPassword}
                />
                <small className="auth-field__hint">新密码需为 12-72 位，并包含大小写字母、数字和特殊字符。</small>
              </label>

              <label className="auth-field profile-settings-field">
                <span>确认新密码</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="请再次输入新密码"
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </label>

              {passwordFeedback ? (
                <div
                  className={passwordFeedback.tone === 'error' ? 'notice notice--error' : 'notice notice--soft'}
                >
                  {passwordFeedback.text}
                </div>
              ) : null}

              <div className="profile-settings-card__actions">
                <button className="button-primary" disabled={passwordBusy} type="submit">
                  <ShieldCheck className="icon-4" />
                  {passwordBusy ? '更新中…' : '修改密码'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="content-section profile-section">
        <div className="section-header">
          <h2>收藏景点</h2>
        </div>

        {user && favorites.length > 0 ? (
          <div className="profile-list">
            {favorites.map((favorite) => (
              <article key={favorite.poiId} className="profile-list-card">
                <div className="profile-list-card__copy">
                  <div className="profile-list-card__meta">
                    <span>
                      <Heart className="icon-4" />
                      已收藏
                    </span>
                    <span>
                      <MapPinned className="icon-4" />
                      {favorite.city}
                    </span>
                  </div>
                  <h3>{favorite.poiName}</h3>
                  <p>{favorite.poiDescription}</p>
                </div>
                <div className="profile-list-card__actions">
                  <Link
                    className="button-secondary"
                    to={`/map?city=${encodeURIComponent(favorite.city)}&poi=${encodeURIComponent(favorite.poiId)}`}
                  >
                    回到地图
                  </Link>
                  <button
                    className="button-secondary"
                    onClick={() => void handleRemoveFavorite(favorite.poiId)}
                    type="button"
                  >
                    {favoriteBusyPoiId === favorite.poiId ? '处理中…' : '取消收藏'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-placeholder">
            <span>还没有收藏景点，可以先去地图页挑选感兴趣的点位。</span>
          </div>
        )}
      </section>

      <section className="content-section profile-section">
        <div className="section-header">
          <h2>历史行程</h2>
        </div>

        {itineraryHistory.length > 0 ? (
          <div className="profile-list">
            {itineraryHistory.map((entry) => (
              <article key={entry.id} className="profile-list-card">
                <div className="profile-list-card__copy">
                  <div className="profile-list-card__meta">
                    <span>
                      <CalendarDays className="icon-4" />
                      {formatHistoryTime(entry.createdAt)}
                    </span>
                    <span>
                      <Sparkles className="icon-4" />
                      {entry.guide.city}
                    </span>
                  </div>
                  <h3>{entry.itinerary.title}</h3>
                  <p>{entry.itinerary.overview}</p>
                </div>
                <div className="profile-list-card__actions">
                  <button
                    className="button-primary"
                    onClick={() => restoreItineraryHistory(entry.id)}
                    type="button"
                  >
                    <RefreshCw className="icon-4" />
                    恢复这份行程
                  </button>
                  <Link className="button-secondary" to="/itinerary">
                    查看行程页
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-placeholder">
            <span>还没有历史行程，可以先去行程页生成一份路线。</span>
          </div>
        )}
      </section>
    </div>
  )
}

function getActionMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请稍后再试。'
}
