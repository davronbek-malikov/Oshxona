"use client";

import Link from "next/link";

type ActiveTab = "home" | "orders" | "history" | "profile";

const TABS: { key: ActiveTab; href: string; labelUz: string; icon: React.ReactNode }[] = [
  {
    key: "home",
    href: "/rider/dashboard",
    labelUz: "Bosh",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    key: "orders",
    href: "/rider/orders",
    labelUz: "Buyurtma",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    key: "history",
    href: "/rider/history",
    labelUz: "Tarix",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "profile",
    href: "/rider/profile",
    labelUz: "Profil",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function RiderNav({ active }: { active: ActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-[640px] mx-auto flex h-[64px]">
        {TABS.map(({ key, href, labelUz, icon }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <span className={isActive ? "text-[#F97316]" : "text-gray-400"}>
                {icon}
              </span>
              <span className={`text-[11px] font-bold ${isActive ? "text-[#F97316]" : "text-gray-400"}`}>
                {labelUz}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
