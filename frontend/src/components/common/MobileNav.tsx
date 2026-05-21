"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, TrendingUp, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/meals", label: "Comidas", icon: Utensils },
  { href: "/meals/new", label: "", icon: PlusCircle, isPrimary: true },
  { href: "/progress", label: "Progreso", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-border lg:hidden z-30 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isPrimary }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all",
              isPrimary
                ? "bg-primary text-white shadow-lg rounded-2xl py-3 px-3 -mt-5 shadow-primary/40"
                : pathname === href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon size={isPrimary ? 24 : 20} />
            {!isPrimary && <span className="text-[10px] font-medium">{label}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}
