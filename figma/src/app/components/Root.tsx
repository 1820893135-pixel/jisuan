import { Outlet, Link, useLocation } from "react-router";
import { Home, Map, Calendar, Maximize2 } from "lucide-react";

export function Root() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/map", label: "地图", icon: Map },
    { path: "/itinerary", label: "行程", icon: Calendar },
    { path: "/panorama", label: "全景", icon: Maximize2 },
  ];

  return (
    <div className="size-full flex flex-col bg-stone-50">
      <Outlet />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50">
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-red-600" : "text-stone-600 hover:text-red-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
