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
                style={{ display: "block" }}
              >
                <defs>
                  <linearGradient
                    id="cloudGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
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
