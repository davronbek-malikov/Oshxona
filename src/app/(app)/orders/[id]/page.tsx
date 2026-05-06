"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Order["status"];

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    quantity: number;
    price_at_order: number;
    menu_items: { name_uz: string } | null;
  }>;
  restaurants: {
    name_uz: string;
    phone: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
  } | null;
}

const STEP_KEYS: Array<{ key: OrderStatus; icon: string }> = [
  { key: "pending_payment",   icon: "⏳" },
  { key: "payment_claimed",   icon: "💸" },
  { key: "payment_confirmed", icon: "✅" },
  { key: "preparing",         icon: "🍳" },
  { key: "ready",             icon: "🎉" },
  { key: "delivered",         icon: "🛵" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending_payment:   0,
  payment_claimed:   1,
  payment_confirmed: 2,
  preparing:         3,
  ready:             4,
  delivered:         5,
  cancelled:         -1,
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<{ stars: number; comment: string | null } | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("orders")
        .select(
          `*,
          order_items(id, quantity, price_at_order, menu_items(name_uz)),
          restaurants(name_uz, phone, bank_name, bank_account_number, bank_account_holder)`
        )
        .eq("id", params.id)
        .single();
      setOrder(data as unknown as OrderWithItems);

      const { data: r } = await supabase
        .from("ratings")
        .select("stars, comment")
        .eq("order_id", params.id)
        .single();
      if (r) setRating(r);

      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`order-status-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          setOrder((prev) =>
            prev ? { ...prev, status: (payload.new as Order).status } : prev
          );
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  async function submitRating() {
    if (!order || stars === 0) return;
    setSubmittingRating(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.id,
        restaurant_id: order.restaurant_id,
        stars,
        comment: comment || null,
      }),
    });
    if (res.ok) setRating({ stars, comment: comment || null });
    setSubmittingRating(false);
  }

  async function handleCancel() {
    setCancelling(true);
    const res = await fetch(`/api/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : prev);
    } else {
      const d = await res.json();
      alert(d.error ?? t("common.error"));
    }
    setCancelling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("orderDetail.title")} not found.</p>
        <Link href="/orders" className="text-primary underline mt-2 block">
          {t("orders.title")}
        </Link>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[order.status] ?? -1;

  if (order.status === "cancelled") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">
          {t("orderDetail.title")} #{order.id.slice(-6).toUpperCase()}
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <span className="text-5xl">❌</span>
          <h2 className="text-xl font-bold mt-3">
            {t("orders.status.cancelled")}
          </h2>
        </div>
        <Link
          href="/menu"
          className="flex items-center justify-center w-full h-12 bg-primary text-white rounded-xl font-semibold"
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {t("orderDetail.title")} #{order.id.slice(-6).toUpperCase()}
        </h1>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              LIVE
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Restaurant info */}
      {order.restaurants && (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{order.restaurants.name_uz}</p>
            {order.restaurants.phone && (
              <p className="text-muted-foreground text-sm">
                📞 {order.restaurants.phone}
              </p>
            )}
          </div>
          {order.restaurants.phone && (
            <a
              href={`tel:${order.restaurants.phone}`}
              className="h-10 px-4 bg-primary/10 text-primary rounded-xl text-sm font-semibold flex items-center"
            >
              📞
            </a>
          )}
        </div>
      )}

      {/* Status stepper */}
      <div className="bg-white rounded-2xl p-4">
        <h2 className="font-semibold mb-4">{t("orders.status." + order.status)}</h2>
        <div className="space-y-3">
          {STEP_KEYS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
                    done
                      ? "bg-green-100 text-green-600"
                      : active
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? "✓" : step.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    active ? "text-primary font-bold" : done ? "" : "text-muted-foreground"
                  }`}
                >
                  {t(`orderDetail.steps.${step.key}`)}
                </span>
                {active && (
                  <span className="ml-auto text-xs text-primary animate-pulse">●</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank transfer info while payment pending */}
      {(order.status === "pending_payment" || order.status === "payment_claimed") &&
        order.restaurants && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">💳 {t("checkout.bankTitle")}</h2>
            <p className="text-sm text-amber-800">
              {order.restaurants.bank_name} •{" "}
              <strong className="font-mono">
                {order.restaurants.bank_account_number}
              </strong>
            </p>
            <p className="text-sm text-amber-800">
              {t("checkout.holder")}: {order.restaurants.bank_account_holder}
            </p>
            <p className="font-bold text-2xl text-primary">
              ₩{order.total_krw.toLocaleString()}
            </p>
          </div>
        )}

      {/* Order items */}
      <div className="bg-white rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold">📋 {t("orderDetail.items")}</h2>
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.menu_items?.name_uz ?? "Item"} × {item.quantity}
            </span>
            <span className="font-medium">
              ₩{(item.price_at_order * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t pt-2">
          <span>{t("orderDetail.total")}</span>
          <span className="text-primary">₩{order.total_krw.toLocaleString()}</span>
        </div>
      </div>

      {/* Rating — only after delivery */}
      {order.status === "delivered" && (
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold">⭐ {t("orderDetail.rateOrder")}</h2>
          {rating ? (
            <div className="text-center py-2">
              <p className="text-3xl mb-1">{"⭐".repeat(rating.stars)}</p>
              <p className="text-sm text-muted-foreground">
                {rating.comment ?? t("orderDetail.ratingDone")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStars(s)}
                    className={`text-3xl transition-transform active:scale-110 ${
                      s <= stars ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="..."
                className="w-full rounded-xl border border-input px-3 py-2 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={submitRating}
                disabled={submittingRating || stars === 0}
                className="w-full h-11 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-40"
              >
                {submittingRating ? "..." : t("orderDetail.submitRating")}
              </button>
            </>
          )}
        </div>
      )}

      {/* Reorder */}
      {order.status === "delivered" && (
        <button
          onClick={() => {
            window.location.href = `/menu/${order.restaurant_id}`;
          }}
          className="w-full h-12 bg-primary/10 text-primary border border-primary/20 rounded-xl font-semibold text-sm"
        >
          🔄 {order.restaurants?.name_uz}
        </button>
      )}

      {/* Cancel — only while awaiting payment */}
      {order.status === "pending_payment" && (
        <button
          onClick={() => setShowCancelConfirm(true)}
          disabled={cancelling}
          className="w-full h-12 border border-destructive text-destructive rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {cancelling ? "..." : t("common.cancel")}
        </button>
      )}

      <ConfirmModal
        open={showCancelConfirm}
        title={t("common.cancel") + "?"}
        description="Buyurtma bekor qilinadi va qaytarib bo'lmaydi."
        confirmLabel={t("common.cancel")}
        cancelLabel="Orqaga"
        destructive
        onConfirm={() => { setShowCancelConfirm(false); handleCancel(); }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <Link
        href="/orders"
        className="block text-center text-sm text-muted-foreground underline"
      >
        {t("orders.title")} →
      </Link>
    </div>
  );
}
