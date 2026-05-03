"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ShoppingCart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/menu", icon: UtensilsCrossed, labelUz: "Menyu", labelEn: "Menu" },
  { href: "/cart", icon: ShoppingCart, labelUz: "Savat", labelEn: "Cart" },
  { href: "/orders", icon: ClipboardList, labelUz: "Buyurtmalar", labelEn: "Orders" },
  { href: "/profile", icon: User, labelUz: "Profil", labelEn: "Profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="max-w-[640px] mx-auto flex">
        {NAV_ITEMS.map(({ href, icon: Icon, labelUz }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-1",
                "min-h-[64px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "text-primary" : "text-muted-foreground"}
              />
              <span className={cn("text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>
                {labelUz}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
