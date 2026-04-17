import { CalendarDays, Heart, LogIn, MapPinned, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTravelApp } from '../context/useTravelApp'

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
    handleRemoveFavorite,
    itineraryHistory,
    openAuthDialog,
    restoreItineraryHistory,
    user,
  } = useTravelApp()

  return (
    <div className="screen-page profile-page">
      <section className="content-section profile-hero">
        <div className="section-header section-header--profile">
          <div>
            <span className="profile-kicker">个人中心</span>
            <h1>{user ? `${user.username} 的导览记录` : '个人中心'}</h1>
            <p className="profile-summary">
              在这里查看收藏点位、历史行程和账号状态，后面继续补“记忆式导览”时也会以这里为入口。
            </p>
          </div>
        </div>

        {user ? (
          <div className="profile-overview">
            <article className="profile-stat-card">
              <small>账号状态</small>
              <strong>已登录</strong>
              <span>欢迎回来，继续你的文化遗产导览。</span>
            </article>
            <article className="profile-stat-card">
              <small>收藏点位</small>
              <strong>{favorites.length}</strong>
              <span>已保存的景点会优先作为后续路线偏好。</span>
            </article>
            <article className="profile-stat-card">
              <small>历史行程</small>
              <strong>{itineraryHistory.length}</strong>
              <span>支持继续恢复之前的 AI 行程规划结果。</span>
            </article>
          </div>
        ) : (
          <div className="profile-empty">
            <LogIn className="icon-6" />
            <strong>登录后即可使用个人中心</strong>
            <span>收藏、历史行程和后续的导览记忆都会保存在账号里。</span>
            <div className="profile-empty__actions">
              <button className="button-primary" onClick={() => openAuthDialog('login')} type="button">
                登录
              </button>
              <button className="button-secondary" onClick={() => openAuthDialog('register')} type="button">
                注册
              </button>
            </div>
          </div>
        )}
      </section>

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
            <span>还没有历史行程，去行程页让“我帮你规划”先生成一份路线。</span>
          </div>
        )}
      </section>
    </div>
  )
}
