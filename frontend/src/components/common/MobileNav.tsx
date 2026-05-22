"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Utensils, TrendingUp, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/meals", label: "Comidas", icon: Utensils },
  { href: "/progress", label: "Progreso", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-border lg:hidden z-30 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Left two items */}
        {NAV_ITEMS.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all",
              pathname === href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}

        {/* Center FAB */}
        <button
          onClick={() => router.push("/meals?add=true")}
          className="bg-primary text-white shadow-lg rounded-2xl py-3 px-3 -mt-5 shadow-primary/40 hover:bg-primary/90 transition-colors"
          aria-label="Agregar comida"
        >
          <Plus size={24} />
        </button>

        {/* Right two items */}
        {NAV_ITEMS.slice(2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all",
              pathname === href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
