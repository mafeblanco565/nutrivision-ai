"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, TrendingUp, User, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { NutriVisionLogo } from "./NutriVisionLogo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meals", label: "Comidas", icon: Utensils },
  { href: "/progress", label: "Progreso", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const { user } = useAuthStore();

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-border z-30">
      {/* Brand */}
      <div className="p-5 border-b border-border">
        <NutriVisionLogo size="sm" variant={theme === "dark" ? "light" : "dark"} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              pathname === href
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-border space-y-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground w-full transition-all"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 w-full transition-all"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
