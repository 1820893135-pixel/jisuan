import {
  CalendarDays,
  House,
  Info,
  Landmark,
  Map,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTravelApp } from "../context/useTravelApp";

const navItems: Array<{
  icon: LucideIcon;
  label: string;
  match: string;
  path: string;
}> = [
  { icon: House, label: "首页", match: "/", path: "/" },
  { icon: Map, label: "地图", match: "/map", path: "/map?scope=national" },
  { icon: CalendarDays, label: "行程", match: "/itinerary", path: "/itinerary" },
  { icon: Landmark, label: "世界遗产", match: "/heritage", path: "/heritage" },
  { icon: Info, label: "关于我们", match: "/about", path: "/about" },
  { icon: UserRound, label: "个人中心", match: "/profile", path: "/profile" },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    authDialogOpen,
    authMode,
    closeAuthDialog,
    handleLogout,
    user,
  } = useTravelApp();

  useEffect(() => {
    if (!authDialogOpen) {
      return;
    }

    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    navigate(
      `/auth/${authMode}?from=${encodeURIComponent(currentPath)}`,
      { replace: false },
    );
    closeAuthDialog();
  }, [
    authDialogOpen,
    authMode,
    closeAuthDialog,
    location.hash,
    location.pathname,
    location.search,
    navigate,
  ]);

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
                aria-hidden="true"
                style={{ display: "block" }}
              >
                <defs>
                  <linearGradient
                    id="forbiddenCityGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f7d774" />
                    <stop offset="55%" stopColor="#e0b544" />
                    <stop offset="100%" stopColor="#b77c16" />
                  </linearGradient>
                  <linearGradient
                    id="forbiddenCityShadow"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f4e2a8" />
                    <stop offset="100%" stopColor="#d79b2e" />
                  </linearGradient>
                </defs>
                <path
                  d="M5.4 10.4L16 4.4l10.6 6-1.8 1.3H7.2z"
                  fill="url(#forbiddenCityGrad)"
                />
                <path
                  d="M7.3 11.9h17.4l-1.5 2.2H8.8z"
                  fill="url(#forbiddenCityShadow)"
                />
                <path
                  d="M9.2 14.7h13.6c1 0 1.8 0.8 1.8 1.8V22H7.4v-5.5c0-1 0.8-1.8 1.8-1.8z"
                  fill="url(#forbiddenCityGrad)"
                />
                <path
                  d="M11.3 14.7v7.3M20.7 14.7v7.3"
                  stroke="#f9e8bc"
                  strokeLinecap="round"
                  strokeWidth="1"
                />
                <path
                  d="M14.1 16.2h3.8c0.7 0 1.2 0.5 1.2 1.2V22h-6.2v-4.6c0-0.7 0.5-1.2 1.2-1.2z"
                  fill="#fff2c8"
                />
                <path
                  d="M6.4 22.7h19.2l-1.8 2.8H8.2z"
                  fill="url(#forbiddenCityShadow)"
                />
                <path
                  d="M10.9 8.3h10.2"
                  stroke="#fff1bf"
                  strokeLinecap="round"
                  strokeWidth="1.1"
                />
                <circle cx="16" cy="8.3" r="1" fill="#fff1bf" />
              </svg>
            </span>
            <span className="top-nav__brand-copy">
              <strong>中国文化遗产导览</strong>
              <small>真实地图 · AI 行程规划</small>
            </span>
          </NavLink>

          <nav className="top-nav__links" aria-label="模块入口">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.match ||
                (item.match !== "/" && location.pathname.startsWith(item.match));

              return (
                <NavLink
                  key={item.path}
                  className={isActive ? "top-nav__link active" : "top-nav__link"}
                  to={item.path}
                >
                  <Icon className="icon-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
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
                <NavLink className="button-secondary" to="/auth/login">
                  登录
                </NavLink>
                <NavLink className="button-primary" to="/auth/register">
                  注册
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
