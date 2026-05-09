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

          {/* Logo — bigger, prominent */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-white"
               style={{ boxShadow: "0 2px 8px rgba(249,115,22,0.2)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Oshxona"
              className="w-full h-full object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.src.endsWith("logo.svg")) {
                  img.src = "/logo.svg";
                } else {
                  img.style.display = "none";
                  img.parentElement!.style.background = "#FFF7ED";
                  img.parentElement!.innerHTML =
                    '<span style="font-size:28px;display:flex;align-items:center;justify-content:center;height:100%">🍽️</span>';
                }
              }}
            />
          </div>

          {/* Title + subtitle */}
          <div>
            <h1 className="text-[20px] font-extrabold leading-tight text-[#111] tracking-tight">
              {title ?? "Oshxona"}
            </h1>
            <p className="text-[13px] text-[#888] font-medium leading-none mt-0.5">
              {subtitle ?? t("shell.subtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-4 pb-[78px]">
        {children}
      </main>

      {!hideNav && <BottomNav />}
      <OrderStatusToast />
    </div>
  );
}
