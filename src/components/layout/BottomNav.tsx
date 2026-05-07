"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ShoppingCart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/context/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.itemCount());
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/menu",    icon: UtensilsCrossed, label: t("nav.menu") },
    { href: "/cart",    icon: ShoppingCart,    label: t("nav.cart"),    badge: true },
    { href: "/orders",  icon: ClipboardList,   label: t("nav.orders") },
    { href: "/profile", icon: User,            label: t("nav.profile") },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="max-w-[640px] mx-auto flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label, ...rest }) => {
          const active = pathname.startsWith(href);
          const showBadge = "badge" in rest && rest.badge && cartCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2.5 gap-1",
                "min-h-[64px] transition-colors relative",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon size={26} strokeWidth={active ? 2.5 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-[20px] bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-sm font-semibold",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
