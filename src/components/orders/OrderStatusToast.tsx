"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/context/LanguageContext";

type OrderStatus =
  | "pending_payment"
  | "payment_claimed"
  | "payment_confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

interface ToastData {
  orderId: string;
  orderCode: string;
  restaurantName: string;
  status: OrderStatus;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { icon: string; from: string; to: string; step: number }
> = {
  pending_payment:   { icon: "⏳", from: "#F59E0B", to: "#F97316", step: 0 },
  payment_claimed:   { icon: "💸", from: "#3B82F6", to: "#6366F1", step: 1 },
  payment_confirmed: { icon: "✅", from: "#10B981", to: "#059669", step: 2 },
  preparing:         { icon: "🍳", from: "#F97316", to: "#EF4444", step: 3 },
  ready:             { icon: "🎉", from: "#F97316", to: "#F59E0B", step: 4 },
  delivered:         { icon: "🛵", from: "#10B981", to: "#0D9488", step: 5 },
  cancelled:         { icon: "❌", from: "#EF4444", to: "#DC2626", step: -1 },
};

const STEPS = 5;
const AUTO_DISMISS_MS = 6000;

export function OrderStatusToast() {
  const { user, loading } = useCurrentUser();
  const { t } = useLanguage();
  const router = useRouter();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((data: ToastData) => {
    setToast(data);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`order-toast-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        async (payload) => {
          const updated = payload.new as {
            id: string;
            status: OrderStatus;
            restaurant_id: string;
          };

          const { data: restaurant } = await supabase
            .from("restaurants")
            .select("name_uz")
            .eq("id", updated.restaurant_id)
            .single();

          showToast({
            orderId: updated.id,
            orderCode: updated.id.slice(-6).toUpperCase(),
            restaurantName: restaurant?.name_uz ?? "Restoran",
            status: updated.status,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loading, showToast]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!toast) return null;

  const cfg = STATUS_CONFIG[toast.status] ?? STATUS_CONFIG.preparing;

  return (
    <div
      className={`fixed bottom-4 left-3 right-3 z-[55] max-w-[620px] mx-auto transition-all duration-400 ease-out ${
        visible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-6 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        style={{ background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})` }}
        onClick={() => {
          dismiss();
          router.push(`/orders/${toast.orderId}`);
        }}
      >
        {/* Top row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {/* Pulsing icon bubble */}
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>
              {cfg.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">
              {t(`orders.status.${toast.status}`)}
            </p>
            <p className="text-white/80 text-sm truncate mt-0.5">
              {toast.restaurantName} &nbsp;·&nbsp; #{toast.orderCode}
            </p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:bg-black/30 flex-shrink-0 text-sm"
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        {cfg.step >= 0 && cfg.step < STEPS && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < cfg.step
                      ? "bg-white"
                      : i === cfg.step
                      ? "bg-white animate-pulse"
                      : "bg-white/25"
                  }`}
                />
              ))}
            </div>
            <p className="text-white/60 text-[10px] mt-1.5 text-right">
              {cfg.step + 1}/{STEPS} · Tap for details →
            </p>
          </div>
        )}

        {/* Delivered / cancelled — no progress, just a tap hint */}
        {(cfg.step >= STEPS || cfg.step < 0) && (
          <div className="px-4 pb-3">
            <p className="text-white/70 text-xs text-right">Tap to view order →</p>
          </div>
        )}

        {/* Bottom auto-dismiss timer bar */}
        <div className="h-0.5 bg-white/20">
          <div
            className="h-full bg-white/50 rounded-full"
            style={{
              width: "100%",
              animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
