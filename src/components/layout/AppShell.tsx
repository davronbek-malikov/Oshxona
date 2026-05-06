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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
            <span className="text-xl">🍽️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">
              {title ?? "Oshxona"}
            </h1>
            <p className="text-xs text-muted-foreground leading-none">
              {subtitle ?? t("shell.subtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      {!hideNav && <BottomNav />}

      {/* Global order status toast — appears above bottom nav on any status change */}
      <OrderStatusToast />
    </div>
  );
}
