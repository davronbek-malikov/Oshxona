"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

const STEPS: Array<{ key: OrderStatus; label: string; icon: string }> = [
  { key: "pending_payment", label: "To'lov kutilmoqda", icon: "⏳" },
  { key: "payment_claimed", label: "To'lov da'vo qilindi", icon: "💸" },
  { key: "payment_confirmed", label: "To'lov tasdiqlandi", icon: "✅" },
  { key: "preparing", label: "Tayyorlanmoqda", icon: "🍳" },
  { key: "ready", label: "Tayyor", icon: "🎉" },
  { key: "delivered", label: "Yetkazildi", icon: "🛵" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending_payment: 0,
  payment_claimed: 1,
  payment_confirmed: 2,
  preparing: 3,
  ready: 4,
  delivered: 5,
  cancelled: -1,
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select(
          `*,
          order_items(id, quantity, price_at_order, menu_items(name_uz)),
          restaurants(name_uz, phone, bank_name, bank_account_number, bank_account_holder)`
        )
        .eq("id", params.id)
        .single();
      setOrder(data as OrderWithItems);
      setLoading(false);
    }
    load();

    // Poll every 10s for status updates
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", params.id)
        .single();
      if (data) {
        setOrder((prev) =>
          prev ? { ...prev, status: data.status } : prev
        );
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Buyurtma topilmadi.</p>
        <Link href="/orders" className="text-primary underline mt-2 block">
          Buyurtmalarim
        </Link>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[order.status] ?? -1;

  if (order.status === "cancelled") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Buyurtma #{order.id.slice(-6).toUpperCase()}</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <span className="text-5xl">❌</span>
          <h2 className="text-xl font-bold mt-3">Buyurtma bekor qilindi</h2>
        </div>
        <Link
          href="/menu"
          className="flex items-center justify-center w-full h-12 bg-primary text-white rounded-xl font-semibold"
        >
          Menyuga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Buyurtma #{order.id.slice(-6).toUpperCase()}
        </h1>
        <span className="text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleString("uz-UZ", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
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
              Qo'ng'iroq
            </a>
          )}
        </div>
      )}

      {/* Status stepper */}
      <div className="bg-white rounded-2xl p-4">
        <h2 className="font-semibold mb-4">Buyurtma holati</h2>
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
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
                  {step.label}
                </span>
                {active && (
                  <span className="ml-auto text-xs text-primary animate-pulse">
                    Hozir
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank info (while pending payment) */}
      {(order.status === "pending_payment" || order.status === "payment_claimed") &&
        order.restaurants && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">💳 To'lov ma'lumotlari</h2>
            <p className="text-sm text-amber-800">
              {order.restaurants.bank_name} •{" "}
              <strong className="font-mono">
                {order.restaurants.bank_account_number}
              </strong>
            </p>
            <p className="text-sm text-amber-800">
              Egasi: {order.restaurants.bank_account_holder}
            </p>
            <p className="font-bold text-2xl text-primary">
              ₩{order.total_krw.toLocaleString()}
            </p>
          </div>
        )}

      {/* Order items */}
      <div className="bg-white rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold">📋 Buyurtma tarkibi</h2>
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.menu_items?.name_uz ?? "Mahsulot"} × {item.quantity}
            </span>
            <span className="font-medium">
              ₩{(item.price_at_order * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Jami</span>
          <span className="text-primary">₩{order.total_krw.toLocaleString()}</span>
        </div>
      </div>

      <Link
        href="/orders"
        className="block text-center text-sm text-muted-foreground underline"
      >
        Barcha buyurtmalar →
      </Link>
    </div>
  );
}
