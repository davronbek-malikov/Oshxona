"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, User } from "lucide-react";

const NAV = [
  { href: "/restaurant/dashboard", icon: LayoutDashboard, label: "Panel" },
  { href: "/restaurant/menu", icon: UtensilsCrossed, label: "Menyu" },
  { href: "/restaurant/orders", icon: ShoppingBag, label: "Buyurtmalar" },
  { href: "/restaurant/profile", icon: User, label: "Profil" },
];

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // These pages have their own full-page layout
  const hideAll = pathname.startsWith("/restaurant/onboarding") || pathname.startsWith("/restaurant/riders");
  const hideNav = hideAll;

  if (hideAll) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
            <span className="text-xl">🏪</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Restoran Panel</h1>
            <p className="text-xs text-muted-foreground leading-none">
              Oshxona boshqaruv tizimi
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
          <div className="max-w-[640px] mx-auto flex">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={22} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
