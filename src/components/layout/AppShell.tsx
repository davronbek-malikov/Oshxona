"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BottomNav } from "./BottomNav";
import { OrderStatusToast } from "@/components/orders/OrderStatusToast";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideNav?: boolean;
}

export function AppShell({ children, title, subtitle, hideNav = false }: AppShellProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEEEEE]">
        <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo — copy your logo.png to public/logo.png to use it */}
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Oshxona"
              className="w-full h-full object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src.endsWith("logo.png")) {
                  img.src = "/logo.svg";
                } else {
                  img.style.display = "none";
                  img.parentElement!.style.background = "#F97316";
                  img.parentElement!.innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">🍽️</span>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold leading-tight text-[#111] tracking-tight">
              {title ?? "Oshxona"}
            </h1>
            <p className="text-[12px] text-[#BBBBBB] leading-none mt-0.5">
              {subtitle ?? t("shell.subtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* Main content — full width, bottom padding clears BottomNav */}
      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-4 pb-[78px]">
        {children}
      </main>

      {/* Coupang-style bottom navigation */}
      {!hideNav && <BottomNav />}

      {/* Global order status toast */}
      <OrderStatusToast />
    </div>
  );
}
