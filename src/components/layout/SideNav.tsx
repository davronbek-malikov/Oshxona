"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ShoppingCart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/context/LanguageContext";

export function SideNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.itemCount());
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/menu",    icon: UtensilsCrossed, label: t("nav.restaurants") },
    { href: "/cart",    icon: ShoppingCart,    label: t("nav.cart"),    badge: true },
    { href: "/orders",  icon: ClipboardList,   label: t("nav.orders") },
    { href: "/profile", icon: User,            label: t("nav.profile") },
  ] as const;

  return (
    <nav className="w-[68px] flex-shrink-0 flex flex-col items-center pt-6 pb-6 gap-2 bg-white border-r border-[#EEEEEE]">
      {NAV_ITEMS.map(({ href, icon: Icon, label, ...rest }) => {
        const active = pathname.startsWith(href);
        const showBadge = "badge" in rest && rest.badge && cartCount > 0;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "w-12 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-colors relative",
              active
                ? "bg-primary/10 text-primary"
                : "text-[#BBBBBB] hover:text-[#888] hover:bg-[#F5F5F5]"
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {showBadge && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={cn(
              "text-[10px] font-bold leading-none text-center",
              active ? "text-primary" : "text-[#BBBBBB]"
            )}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
