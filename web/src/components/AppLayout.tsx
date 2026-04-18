import {
  CalendarDays,
  House,
  Map,
  UserRound,
  Landmark,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTravelApp } from '../context/useTravelApp'
import { AuthDialog } from './AuthDialog'

const navItems: Array<{
  icon: LucideIcon
  label: string
  match: string
  path: string
}> = [
  { icon: House, label: '首页', match: '/', path: '/' },
  { icon: Map, label: '地图', match: '/map', path: '/map?scope=national' },
  { icon: CalendarDays, label: '行程', match: '/itinerary', path: '/itinerary' },
  { icon: Landmark, label: '世界遗产', match: '/heritage', path: '/heritage' },
  { icon: Info, label: '关于我们', match: '/about', path: '/about' },
  { icon: UserRound, label: '个人中心', match: '/profile', path: '/profile' },
]

export function AppLayout() {
  const location = useLocation()
  const { handleLogout, openAuthDialog, user } = useTravelApp()

  return (
    <div className="app-frame">
      <header className="top-nav" aria-label="主导航">
        <div className="top-nav__inner">
          <NavLink className="top-nav__brand" to="/">
            <span className="top-nav__brand-mark">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
              >
                <defs>
                  <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#b8860b" />
                    <stop offset="100%" stopColor="#d4af37" />
                  </linearGradient>
                </defs>
                <path
                  d="M24 12c1.5 0 2.8-1.2 2.8-2.7 0-1.3-0.9-2.4-2.1-2.6 0-0.1 0-0.1 0-0.2 0-1.8-1.4-3.2-3.2-3.2-0.8 0-1.6 0.3-2.2 0.9C18.5 3.4 17 2.7 15.5 2.7c-2.3 0-4.2 1.9-4.2 4.2 0 0.3 0 0.5 0.1 0.8C10.4 8.1 9 9.4 9 11c0 1.7 1.3 3 3 3h12z"
                  fill="url(#cloudGrad)"
                />
                <path
                  d="M27 18c0-2.2-1.5-4-3.5-4.5 0.1-0.4 0.1-0.8 0.1-1.2 0-2.5-2-4.5-4.5-4.5-0.8 0-1.6 0.2-2.2 0.6-0.9-1.6-2.6-2.7-4.6-2.7-3 0-5.4 2.4-5.4 5.4 0 0.6 0.1 1.2 0.3 1.7C6.6 13.4 5 15.5 5 18c0 2.8 2.2 5 5 5h14c2.2 0 4-1.8 4-4 0-0.3 0-0.6-0.1-0.9 0.6-0.3 1.1-0.8 1.1-1.6z"
                  fill="url(#cloudGrad)"
                />
              </svg>
            </span>
            <span className="top-nav__brand-copy">
              <strong>中国文化遗产导览</strong>
              <small>真实地图 · AI 行程规划</small>
            </span>
          </NavLink>

          <nav className="top-nav__links" aria-label="模块入口">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.match ||
                (item.match !== '/' && location.pathname.startsWith(item.match))

              return (
                <NavLink
                  key={item.path}
                  className={isActive ? 'top-nav__link active' : 'top-nav__link'}
                  to={item.path}
                >
                  <Icon className="icon-5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="top-nav__actions">
            {user ? (
              <div className="top-nav__user">
                <NavLink className="top-nav__profile" to="/profile">
                  <span className="top-nav__user-copy">
                    <small>已登录</small>
                    <strong>{user.username}</strong>
                  </span>
                </NavLink>
                <button className="button-secondary" onClick={handleLogout} type="button">
                  退出
                </button>
              </div>
            ) : (
              <div className="top-nav__auth">
                <button className="button-secondary" onClick={() => openAuthDialog('login')} type="button">
                  登录
                </button>
                <button className="button-primary" onClick={() => openAuthDialog('register')} type="button">
                  注册
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
      <AuthDialog />

      <style>{`
        .top-nav {
          background: linear-gradient(135deg, #fffcf0 0%, #fff8e7 100%);
          border-bottom: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(212, 175, 55, 0.1);
          position: relative;
          z-index: 10;
        }

        /* 底部微光过渡线 */
        .top-nav::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #d4af37, #f5e7a3, #d4af37, transparent);
          opacity: 0.6;
        }

        /* 导航栏内部容器：使用 flex 布局，让品牌靠左，其他靠右 */
        .top-nav__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* 品牌区域完全靠左，移除默认边距 */
        .top-nav__brand {
          flex-shrink: 0;
          margin-right: 2rem;
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .top-nav__brand-mark svg {
          stroke: none;
          stroke-width: 0;
          border: none;
          outline: none;
        }

        .top-nav__brand-copy strong {
          background: linear-gradient(135deg, #b8860b, #d4af37);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 700;
        }

        .top-nav__brand-copy small {
          color: #8a7a5a;
        }

        /* 导航链接容器：居中或自适应，用 gap 分散 */
        .top-nav__links {
          display: flex;
          gap: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .top-nav__link {
          color: #4a5a4a;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .top-nav__link:hover {
          color: #b8860b;
          background: rgba(212, 175, 55, 0.08);
        }

        .top-nav__link.active {
          color: #b8860b;
          position: relative;
        }

        .top-nav__link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 12px;
          right: 12px;
          height: 2px;
          background: linear-gradient(90deg, #d4af37, #f5e7a3);
          border-radius: 2px;
        }

        /* 右侧按钮区域 */
        .top-nav__actions {
          flex-shrink: 0;
        }

        .button-secondary {
          border-color: #d4af37;
          color: #b8860b;
        }

        .button-secondary:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: #d4af37;
          color: #8a6e2e;
        }

        .button-primary {
          background: linear-gradient(135deg, #b8860b, #d4af37);
          border: none;
        }

        .button-primary:hover {
          background: linear-gradient(135deg, #9a6e0a, #c4a030);
        }

        .top-nav__user-copy strong {
          color: #b8860b;
        }

        .top-nav__profile:hover .top-nav__user-copy strong {
          color: #d4af37;
        }

        /* 确保主内容区与导航栏紧密贴合 */
        .app-main {
          margin-top: 0;
          padding-top: 0;
        }

        /* 响应式：小屏幕下减少间距 */
        @media (max-width: 768px) {
          .top-nav__inner {
            padding: 0 16px;
          }
          .top-nav__links {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
