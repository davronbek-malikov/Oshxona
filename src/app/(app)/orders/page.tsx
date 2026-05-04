"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "To'lov kutilmoqda",
  payment_claimed: "To'lov da'vo qilindi",
  payment_confirmed: "To'lov tasdiqlandi",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor!",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-700",
  payment_claimed: "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-green-100 text-green-700",
  preparing: "bg-orange-100 text-orange-700",
  ready: "bg-primary/10 text-primary",
  delivered: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-700",
};

interface OrderWithRestaurant extends Order {
  restaurants: { name_uz: string } | null;
}

export default function OrdersPage() {
  const { user } = useCurrentUser();
  const [orders, setOrders] = useState<OrderWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select(`*, restaurants(name_uz)`)
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setOrders((data ?? []) as unknown as OrderWithRestaurant[]);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <span className="text-7xl mb-4">📋</span>
        <h2 className="text-xl font-bold">Buyurtmalar yo'q</h2>
        <p className="text-muted-foreground mt-2">
          Hali birorta buyurtma bermagansiz
        </p>
        <Link
          href="/menu"
          className="mt-6 h-12 px-8 bg-primary text-white rounded-xl flex items-center font-semibold"
        >
          Menyuga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Buyurtmalarim</h1>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="block bg-white rounded-2xl p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold">
                #{order.id.slice(-6).toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.restaurants?.name_uz}
              </p>
            </div>
            <span
              className={`text-xs rounded-full px-3 py-1 font-medium flex-shrink-0 ${
                STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("uz-UZ", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="font-bold text-primary">
              ₩{order.total_krw.toLocaleString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
