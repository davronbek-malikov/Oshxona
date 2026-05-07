"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SideNav } from "./SideNav";
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
    <div className="flex flex-col min-h-screen bg-background max-w-[640px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEEEEE]">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary">
            <span className="text-xl">🍽️</span>
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

      {/* Body: left sidebar + content */}
      <div className="flex flex-1">
        {/* Left sidebar */}
        {!hideNav && (
          <div className="sticky top-[57px] h-[calc(100vh-57px)] flex-shrink-0">
            <SideNav />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 py-4 pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Order status toast — positioned to clear the sidebar */}
      <OrderStatusToast />
    </div>
  );
}
