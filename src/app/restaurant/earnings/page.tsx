"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EarningsData {
  pendingPayoutKrw: number;
  paidTotalKrw: number;
  todaySalesKrw: number;
  totalOrdersDelivered: number;
  commissionRate: number;
  nextPayoutAt: string;
  recentOrders: Array<{
    id: string;
    total_krw: number;
    restaurant_share: number;
    commission_krw: number;
    created_at: string;
    paid: boolean;
  }>;
}

export default function RestaurantEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/restaurant/earnings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Ma&apos;lumot yuklanmadi
      </div>
    );
  }

  const commissionPct = Math.round(data.commissionRate * 100);

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/restaurant/dashboard" className="text-muted-foreground text-sm">← Orqaga</Link>
        <h1 className="text-xl font-bold">Daromad</h1>
      </div>

      {/* Payout notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💳</span>
        <div>
          <p className="font-semibold text-amber-800 text-sm">Har kuni ertalab 08:00 da to&apos;lov</p>
          <p className="text-amber-700 text-xs mt-0.5">
            Platform {commissionPct}% komissiya va kuryer haqi ushlab qoladi, qolgan qism bankingizga o&apos;tkaziladi
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Bugun sotildi</p>
          <p className="text-2xl font-bold text-primary mt-1">₩{data.todaySalesKrw.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Jami buyurtma</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalOrdersDelivered}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Kutilayotgan to&apos;lov (ertaga 08:00)</p>
          <p className="text-3xl font-bold text-primary">₩{data.pendingPayoutKrw.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Avval to&apos;langan: ₩{data.paidTotalKrw.toLocaleString()}</p>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
        <p className="font-bold text-sm">Hisoblash tartibi</p>
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex justify-between">
            <span>Oziq-ovqat narxi</span><span className="font-semibold text-gray-700">100%</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Platform komissiyasi</span><span>−{commissionPct}%</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Kuryer haqi (yetkazishda)</span><span>−₩3,000–15,000</span>
          </div>
          <div className="flex justify-between font-bold text-primary border-t border-gray-100 pt-1.5">
            <span>Sizga to&apos;lanadigan qism</span><span>~{100 - commissionPct}%</span>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      {data.recentOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="font-bold text-sm">So&apos;nggi buyurtmalar</p>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">#{o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("ko-KR", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[11px] text-red-400">−₩{o.commission_krw.toLocaleString()} komissiya</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-primary">+₩{o.restaurant_share.toLocaleString()}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    o.paid ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                  }`}>
                    {o.paid ? "To'landi" : "Kutilmoqda"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
