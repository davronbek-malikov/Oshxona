"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

export default function RestaurantDashboardPage() {
  const { user, loading } = useCurrentUser();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data: r } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user!.id)
        .single();
      setRestaurant(r);

      if (r) {
        const { data: o } = await supabase
          .from("orders")
          .select("*")
          .eq("restaurant_id", r.id)
          .in("status", [
            "pending_payment",
            "payment_claimed",
            "payment_confirmed",
            "preparing",
            "ready",
          ])
          .order("created_at", { ascending: false })
          .limit(20);
        setOrders(o ?? []);
      }
      setFetching(false);
    }
    load();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  // No restaurant → prompt onboarding
  if (!restaurant) {
    return (
      <div className="text-center py-16 space-y-4">
        <span className="text-6xl">🏪</span>
        <h2 className="text-xl font-bold">Restoran yo'q</h2>
        <p className="text-muted-foreground text-sm">
          Hali restoraningizni ro'yxatdan o'tkazmagansiz.
        </p>
        <Link
          href="/restaurant/onboarding"
          className="inline-flex items-center justify-center h-12 px-6 bg-primary text-white font-semibold rounded-xl"
        >
          Ro'yxatdan o'tish →
        </Link>
      </div>
    );
  }

  // Pending approval
  if (!restaurant.is_approved) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <span className="text-4xl">⏳</span>
          <h2 className="text-lg font-bold mt-3">Tasdiqlash kutilmoqda</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Restoraningiz admin tomonidan ko'rib chiqilmoqda. Odatda 24 soat
            ichida tasdiqlash amalga oshiriladi.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Your application is being reviewed. Usually takes up to 24 hours.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-2 text-sm">
          <p className="font-semibold">📋 Yuborilgan ma'lumotlar</p>
          <p>
            <span className="text-muted-foreground">Nomi:</span>{" "}
            {restaurant.name_uz}
          </p>
          <p>
            <span className="text-muted-foreground">Manzil:</span>{" "}
            {restaurant.address}
          </p>
          <p>
            <span className="text-muted-foreground">Telefon:</span>{" "}
            {restaurant.phone}
          </p>
        </div>
      </div>
    );
  }

  async function toggleActive() {
    if (!restaurant) return;
    setToggling(true);
    const supabase = createClient();
    const newValue = !restaurant.is_active;
    await supabase
      .from("restaurants")
      .update({ is_active: newValue })
      .eq("id", restaurant.id);
    setRestaurant((prev) => prev ? { ...prev, is_active: newValue } : prev);
    setToggling(false);
  }

  // Approved dashboard
  const pendingCount = orders.filter(
    (o) => o.status === "pending_payment" || o.status === "payment_claimed"
  ).length;

  const activeCount = orders.filter(
    (o) =>
      o.status === "payment_confirmed" ||
      o.status === "preparing" ||
      o.status === "ready"
  ).length;

  return (
    <div className="space-y-4">
      {/* Restaurant card */}
      <div className="bg-primary rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏪</span>
            <div>
              <h2 className="text-xl font-bold">{restaurant.name_uz}</h2>
              <p className="text-primary-foreground/80 text-sm">
                {restaurant.address}
              </p>
            </div>
          </div>

          {/* Open / Closed toggle */}
          <button
            onClick={toggleActive}
            disabled={toggling}
            className={`flex-shrink-0 flex items-center gap-2 px-4 h-10 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
              restaurant.is_active
                ? "bg-green-400/30 text-white border border-green-300"
                : "bg-white/20 text-white/70 border border-white/30"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${restaurant.is_active ? "bg-green-300" : "bg-white/50"}`} />
            {restaurant.is_active ? "Open" : "Closed"}
          </button>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-primary-foreground/80">To'lov kutilmoqda</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-primary-foreground/80">Tayyorlanmoqda</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/restaurant/orders"
          className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
        >
          <span className="text-3xl">📦</span>
          <span className="font-semibold text-sm text-center">Buyurtmalar</span>
          {pendingCount > 0 && (
            <span className="bg-destructive text-white text-xs rounded-full px-2 py-0.5">
              {pendingCount} yangi
            </span>
          )}
        </Link>
        <Link
          href="/restaurant/menu"
          className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
        >
          <span className="text-3xl">🍽️</span>
          <span className="font-semibold text-sm">Menyu boshqarish</span>
        </Link>
      </div>

      {/* Recent orders */}
      {orders.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3">Faol buyurtmalar</h3>
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/restaurant/orders`}
                className="block bg-white rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(order.created_at).toLocaleTimeString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      ₩{order.total_krw.toLocaleString()}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending_payment: { label: "To'lov kutilmoqda", color: "bg-yellow-100 text-yellow-700" },
    payment_claimed: { label: "To'lov da'vo qilindi", color: "bg-blue-100 text-blue-700" },
    payment_confirmed: { label: "To'lov tasdiqlandi", color: "bg-green-100 text-green-700" },
    preparing: { label: "Tayyorlanmoqda", color: "bg-orange-100 text-orange-700" },
    ready: { label: "Tayyor", color: "bg-primary/10 text-primary" },
    delivered: { label: "Yetkazildi", color: "bg-gray-100 text-gray-600" },
    cancelled: { label: "Bekor qilindi", color: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}
