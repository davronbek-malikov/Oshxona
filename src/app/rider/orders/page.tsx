"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

type Tab = "available" | "mine" | "done";

interface RiderInfo {
  id: string;
  status: "offline" | "online" | "busy";
}

interface Order {
  id: string;
  total_krw: number;
  rider_fee_krw: number;
  delivery_address: string;
  created_at: string;
  status: string;
  rider_status: string | null;
  restaurants: { id: string; name_uz: string; address: string; phone?: string } | null;
  order_items: Array<{ id: string; quantity: number; menu_items: { name_uz: string } | null }>;
}

function elapsed(created: string) {
  const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000);
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

export default function RiderOrdersPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("available");
  const [orders, setOrders] = useState<Order[]>([]);
  const [rider, setRider] = useState<RiderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = useCallback(async (type: Tab) => {
    setLoading(true);
    const res = await fetch(`/api/rider/orders?type=${type}`);
    if (res.status === 401) { router.replace("/login"); return; }
    if (res.status === 404) { router.replace("/rider/onboarding"); return; }
    const data = await res.json();
    if (res.status === 403 && data.pending) { router.replace("/rider/pending"); return; }
    if (res.status === 403 && data.blocked) { router.replace("/rider/blocked"); return; }
    setOrders(data.orders ?? []);
    setRider(data.rider);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(tab); }, [tab, load]);

  // Real-time: refresh available orders when new ones appear
  useEffect(() => {
    if (tab !== "available") return;
    const supabase = createClient();
    const channel = supabase.channel("rider-available-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load("available"))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tab, load]);

  async function toggleStatus() {
    if (!rider) return;
    setStatusLoading(true);

    let newStatus: "offline" | "online";
    if (rider.status === "offline") {
      newStatus = "online";
      navigator.geolocation?.getCurrentPosition(async (pos) => {
        await fetch("/api/rider/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        setRider((r) => r ? { ...r, status: newStatus } : r);
        setStatusLoading(false);
      }, async () => {
        await fetch("/api/rider/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        setRider((r) => r ? { ...r, status: newStatus } : r);
        setStatusLoading(false);
      });
    } else {
      newStatus = "offline";
      await fetch("/api/rider/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setRider((r) => r ? { ...r, status: newStatus } : r);
      setStatusLoading(false);
    }
  }

  const TABS = [
    { key: "available" as Tab, label: t("rider.newOrders") },
    { key: "mine" as Tab,      label: t("rider.myOrders") },
    { key: "done" as Tab,      label: t("rider.doneOrders") },
  ];

  const statusColor = rider?.status === "online" ? "bg-green-500" : rider?.status === "busy" ? "bg-orange-400" : "bg-gray-300";
  const statusLabel = rider?.status === "online"
    ? (lang === "uz" ? "Online" : "Online")
    : rider?.status === "busy"
    ? (lang === "uz" ? "Band" : "Busy")
    : (lang === "uz" ? "Offline" : "Offline");

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            <span className="font-bold text-[16px] text-gray-900">{statusLabel}</span>
          </div>
          <button
            onClick={toggleStatus}
            disabled={statusLoading || rider?.status === "busy"}
            className={`px-5 h-10 rounded-full font-bold text-[14px] transition-colors disabled:opacity-50 ${
              rider?.status === "offline"
                ? "bg-[#F97316] text-white"
                : "bg-orange-50 text-[#F97316] border border-orange-200"
            }`}
          >
            {statusLoading ? "..." : rider?.status === "offline" ? t("rider.online") : t("rider.offline")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 max-w-[640px] mx-auto w-full">
        {TABS.map(({ key, label }) => {
          const count = tab === key ? orders.length : 0;
          return (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-[14px] font-bold transition-colors relative ${
                tab === key ? "text-[#F97316]" : "text-gray-400"
              }`}>
              {label}
              {tab === key && count > 0 && (
                <span className="ml-1.5 text-[11px] bg-[#F97316] text-white rounded-full px-1.5 py-0.5">{count}</span>
              )}
              {tab === key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F97316] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Order list */}
      <div className="flex-1 max-w-[640px] mx-auto w-full px-4 py-3 pb-24 space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-5xl mb-3">📭</span>
            <p className="text-gray-400 text-[14px]">
              {tab === "available" ? t("rider.noNewOrders")
               : tab === "mine" ? t("rider.noMyOrders")
               : t("rider.noDoneOrders")}
            </p>
            {tab === "available" && rider?.status === "offline" && (
              <p className="text-[#F97316] text-[13px] mt-2">
                {lang === "uz" ? "Buyurtmalarni ko'rish uchun online bo'ling" : "Go online to see available orders"}
              </p>
            )}
          </div>
        )}

        {!loading && orders.map((order) => (
          <Link key={order.id} href={`/rider/orders/${order.id}`}>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
              {/* Top bar — orange for available, green for mine */}
              <div className={`h-1 ${tab === "available" ? "bg-[#F97316]" : tab === "mine" ? "bg-green-500" : "bg-gray-200"}`} />

              <div className="p-4 space-y-3">
                {/* Time + fee row */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">
                    {tab === "done" ? new Date(order.created_at).toLocaleDateString("ko-KR") : elapsed(order.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-300 line-through">
                      ₩{order.total_krw.toLocaleString()}
                    </span>
                    <span className="text-[15px] font-extrabold text-[#F97316]">
                      ₩{(order.rider_fee_krw ?? 3000).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Restaurant → Customer */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[16px] flex-shrink-0 mt-0.5">🏪</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-gray-900">{order.restaurants?.name_uz}</p>
                      <p className="text-[12px] text-gray-400 truncate">{order.restaurants?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[16px] flex-shrink-0 mt-0.5">📦</span>
                    <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{order.delivery_address}</p>
                  </div>
                </div>

                {/* Items summary */}
                <p className="text-[12px] text-gray-300">
                  {order.order_items?.map((i) => `${i.menu_items?.name_uz ?? "?"} ×${i.quantity}`).join(", ")}
                </p>

                {/* Status badge for mine tab */}
                {order.rider_status && tab === "mine" && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${
                    order.rider_status === "accepted" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {order.rider_status === "accepted"
                      ? (lang === "uz" ? "Qabul qilindi" : "Accepted")
                      : (lang === "uz" ? "Olingan" : "Picked up")}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-[640px] mx-auto flex h-[62px]">
          {[
            { href: "/rider/orders", icon: "📋", label: lang === "uz" ? "Buyurtmalar" : "Orders", active: true },
            { href: "/rider/profile", icon: "👤", label: lang === "uz" ? "Profil" : "Profile", active: false },
          ].map(({ href, icon, label, active }) => (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1">
              <span className="text-xl">{icon}</span>
              <span className={`text-[11px] font-bold ${active ? "text-[#F97316]" : "text-gray-400"}`}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
