import {
  CalendarDays,
  Compass,
  House,
  Map,
  UserRound,
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
              <Compass className="icon-5" />
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
    </div>
  )
}
