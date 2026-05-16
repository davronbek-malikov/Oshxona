"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiderNav } from "@/components/rider/RiderNav";

interface DashboardData {
  name: string;
  status: "offline" | "online" | "busy";
  ordersCompleted: number;
  activeCount: number;
  availableCount: number;
  todayEarnings: number;
}

export default function RiderDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    const [mineRes, availRes] = await Promise.all([
      fetch("/api/rider/orders?type=mine"),
      fetch("/api/rider/orders?type=available"),
    ]);

    if (mineRes.status === 401) { router.replace("/login"); return; }
    if (mineRes.status === 404) { router.replace("/rider/onboarding"); return; }

    const mineJson = await mineRes.json();
    if (mineJson.pending) { router.replace("/rider/pending"); return; }
    if (mineJson.blocked) { router.replace("/rider/blocked"); return; }

    const availJson = availRes.ok ? await availRes.json() : { orders: [] };

    const earningsRes = await fetch("/api/rider/earnings");
    const earningsJson = earningsRes.ok ? await earningsRes.json() : {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEarnings = (earningsJson.deliveries ?? [])
      .filter((d: { delivered_at: string }) => new Date(d.delivered_at) >= todayStart)
      .reduce((sum: number, d: { fee_krw: number }) => sum + (d.fee_krw ?? 0), 0);

    setData({
      name: mineJson.rider?.name ?? "Haydovchi",
      status: mineJson.rider?.status ?? "offline",
      ordersCompleted: mineJson.rider?.orders_completed ?? 0,
      activeCount: (mineJson.orders ?? []).length,
      availableCount: (availJson.orders ?? []).length,
      todayEarnings,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function toggleOnline() {
    if (!data || toggling || data.status === "busy") return;
    setToggling(true);
    const newStatus = data.status === "offline" ? "online" : "offline";

    const doToggle = async (lat?: number, lng?: number) => {
      await fetch("/api/rider/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...(lat ? { lat, lng } : {}) }),
      });
      setData((d) => d ? { ...d, status: newStatus } : d);
      setToggling(false);
    };

    if (newStatus === "online") {
      navigator.geolocation?.getCurrentPosition(
        (pos) => doToggle(pos.coords.latitude, pos.coords.longitude),
        () => doToggle(),
      );
    } else {
      await doToggle();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  const isOnline = data?.status === "online" || data?.status === "busy";

  return (
    <div className="min-h-screen bg-[#F5F1EC] pb-24">
      <div className="max-w-[640px] mx-auto px-4 pt-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[13px] text-gray-400 font-medium">Xush kelibsiz</p>
            <h1 className="text-[26px] font-bold text-gray-900 mt-0.5">{data?.name}</h1>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling || data?.status === "busy"}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all disabled:opacity-60 shadow-sm ${
              isOnline
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
            {toggling ? "..." : isOnline ? "Ketish" : "Online"}
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={<BoxIcon />}
            value={data?.ordersCompleted ?? 0}
            label="Jami"
            iconColor="text-[#F97316]"
            valueColor="text-[#F97316]"
          />
          <StatCard
            icon={<TruckIcon />}
            value={data?.activeCount ?? 0}
            label="Faol"
            iconColor="text-[#F97316]"
            valueColor="text-[#F97316]"
          />
          <StatCard
            icon={<ClockIcon />}
            value={data?.availableCount ?? 0}
            label="Kutmoqda"
            iconColor="text-emerald-500"
            valueColor="text-emerald-600"
          />
        </div>

        {/* Today earnings banner */}
        {isOnline && (data?.todayEarnings ?? 0) > 0 && (
          <div className="bg-white rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow-sm border border-gray-100">
            <p className="text-[13px] text-gray-500">Bugungi daromad</p>
            <p className="text-[18px] font-bold text-[#F97316]">₩{(data?.todayEarnings ?? 0).toLocaleString()}</p>
          </div>
        )}

        {/* Offline state */}
        {!isOnline && (
          <div className="flex flex-col items-center justify-center pt-10 pb-6 text-center gap-5">
            <div className="w-20 h-20 bg-gray-100 rounded-[20px] flex items-center justify-center">
              <TruckIconLarge />
            </div>
            <div className="space-y-1.5">
              <p className="text-[20px] font-bold text-gray-800">Siz offlinesiz</p>
              <p className="text-[14px] text-[#F97316] leading-relaxed max-w-[240px] mx-auto">
                Buyurtmalarni ko&apos;rish uchun Online tugmasini bosing
              </p>
            </div>
          </div>
        )}

        {/* Online state */}
        {isOnline && (
          <div className="space-y-3">
            <Link
              href="/rider/orders"
              className="flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="font-bold text-[15px] text-gray-900">Buyurtmalar</p>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  {data?.availableCount ?? 0} ta yangi buyurtma
                </p>
              </div>
              <span className="text-[#F97316] text-[20px] font-light">→</span>
            </Link>

            {(data?.activeCount ?? 0) > 0 && (
              <Link
                href="/rider/orders"
                className="flex items-center justify-between bg-[#F97316] rounded-2xl px-4 py-4 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div>
                  <p className="font-bold text-[15px] text-white">Faol yetkazishlar</p>
                  <p className="text-[13px] text-white/80 mt-0.5">{data?.activeCount} ta davom etmoqda</p>
                </div>
                <span className="text-white text-[20px] font-light">→</span>
              </Link>
            )}
          </div>
        )}
      </div>

      <RiderNav active="home" />
    </div>
  );
}

function StatCard({
  icon, value, label, iconColor, valueColor,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  iconColor: string;
  valueColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100/50">
      <span className={`flex justify-center ${iconColor}`}>{icon}</span>
      <p className={`text-[22px] font-bold mt-1 ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function TruckIconLarge() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
      <rect x="1" y="3" width="15" height="13" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
