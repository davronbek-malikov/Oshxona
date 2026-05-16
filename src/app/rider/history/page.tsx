"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiderNav } from "@/components/rider/RiderNav";

interface Order {
  id: string;
  total_krw: number;
  rider_fee_krw: number;
  delivery_address: string;
  created_at: string;
  restaurants: { name_uz: string } | null;
}

interface RiderInfo {
  total_earnings_krw: number;
  orders_completed: number;
  pending_payout_krw?: number;
}

export default function RiderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rider, setRider] = useState<RiderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/rider/orders?type=done");
      if (res.status === 401) { router.replace("/login"); return; }
      if (res.status === 404) { router.replace("/rider/onboarding"); return; }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setRider(data.rider ?? null);
      setLoading(false);
    }
    load();
  }, [router]);

  // Group orders by date
  const grouped = orders.reduce<Record<string, Order[]>>((acc, o) => {
    const day = new Date(o.created_at).toLocaleDateString("ko-KR", {
      year: "numeric", month: "short", day: "numeric",
    });
    (acc[day] ??= []).push(o);
    return acc;
  }, {});

  const totalToday = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, o) => sum + (o.rider_fee_krw ?? 3000), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1EC] pb-24">
      <div className="max-w-[640px] mx-auto">

        {/* Header */}
        <div className="px-4 pt-10 pb-4">
          <h1 className="text-[24px] font-bold text-gray-900">Tarix</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{rider?.orders_completed ?? 0} ta yetkazish bajarildi</p>
        </div>

        {/* Summary cards */}
        <div className="px-4 grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Bugungi daromad</p>
            <p className="text-[22px] font-bold text-[#F97316] mt-1">₩{totalToday.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Jami daromad</p>
            <p className="text-[22px] font-bold text-gray-900 mt-1">
              ₩{(rider?.total_earnings_krw ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payout notice */}
        <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-[12px] text-amber-700 font-medium">
            💳 Har kuni ertalab soat 08:00 da bank hisobingizga o&apos;tkaziladi
          </p>
        </div>

        {/* Order history grouped by day */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-gray-400 text-[14px]">Hali yetkazish yo&apos;q</p>
          </div>
        ) : (
          <div className="px-4 space-y-4">
            {Object.entries(grouped).map(([day, dayOrders]) => {
              const dayTotal = dayOrders.reduce((s, o) => s + (o.rider_fee_krw ?? 3000), 0);
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">{day}</p>
                    <p className="text-[13px] font-bold text-[#F97316]">+₩{dayTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {dayOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between px-4 py-3.5">
                        <div>
                          <p className="text-[14px] font-semibold text-gray-900">
                            {o.restaurants?.name_uz ?? "Restoran"}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                            {o.delivery_address}
                          </p>
                          <p className="text-[11px] text-gray-300 mt-0.5">
                            #{o.id.slice(-6).toUpperCase()} ·{" "}
                            {new Date(o.created_at).toLocaleTimeString("ko-KR", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-[15px] font-extrabold text-[#F97316] flex-shrink-0 ml-3">
                          +₩{(o.rider_fee_krw ?? 3000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RiderNav active="history" />
    </div>
  );
}
