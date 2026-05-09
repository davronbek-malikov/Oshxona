"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/context/LanguageContext";
import { SmartEmptyOrders } from "@/components/orders/SmartEmptyOrders";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_COLORS: Record<string, string> = {
  pending_payment:   "bg-yellow-100 text-yellow-700",
  payment_claimed:   "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-green-100 text-green-700",
  preparing:         "bg-orange-100 text-orange-700",
  ready:             "bg-primary/10 text-primary",
  delivered:         "bg-gray-100 text-gray-500",
  cancelled:         "bg-red-100 text-red-700",
};

interface OrderWithRestaurant extends Order {
  restaurants: { name_uz: string } | null;
}

export default function OrdersPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;          // still resolving auth
    if (!user) { setLoading(false); return; }  // not logged in → stop spinner
    const supabase = createClient();

    async function load() {
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

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === (payload.new as Order).id
                ? { ...o, status: (payload.new as Order).status }
                : o
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return <SmartEmptyOrders />;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{t("orders.title")}</h1>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="block bg-white rounded-2xl p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold">#{order.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">
                {order.restaurants?.name_uz}
              </p>
            </div>
            <span
              className={`text-xs rounded-full px-3 py-1 font-medium flex-shrink-0 ${
                STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {t(`orders.status.${order.status}`) || order.status}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("ko-KR", {
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
