"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

interface Delivery {
  id: string;
  fee_krw: number;
  distance_km: number | null;
  delivered_at: string;
  order_id: string;
}

interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: string;
  payment_method: string;
  total_earnings_krw: number;
  orders_completed: number;
  penalty_krw: number;
  bank_name: string | null;
  bank_account_number: string | null;
  is_approved: boolean;
  is_blocked: boolean;
  block_reason: string | null;
}

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: "🏍️", bicycle: "🚲", car: "🚗", walking: "🚶",
};

export default function RiderProfilePage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const uz = lang === "uz";
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/rider/orders?type=done").then((r) => r.json()),
      fetch("/api/rider/earnings").then((r) => r.json()),
    ]).then(([d, e]) => {
      setProfile(d.rider);
      setDeliveries(e.deliveries ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Real-time updates when delivery_riders row changes
  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel(`rider-profile-${profile.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "delivery_riders",
        filter: `id=eq.${profile.id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        setProfile((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
    </div>
  );

  const netEarnings = (profile?.total_earnings_krw ?? 0) - (profile?.penalty_krw ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-[22px] font-extrabold">{uz ? "Mening profilim" : "My Profile"}</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Blocked warning */}
        {profile?.is_blocked && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="font-bold text-red-600 text-[15px]">🚫 {uz ? "Hisobingiz bloklangan" : "Account blocked"}</p>
            {profile.block_reason && (
              <p className="text-red-500 text-[13px] mt-1">{profile.block_reason}</p>
            )}
          </div>
        )}

        {/* Rider card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-3xl">
              {VEHICLE_ICONS[profile?.vehicle ?? "motorcycle"]}
            </div>
            <div>
              <p className="font-extrabold text-[20px] text-gray-900">{profile?.name}</p>
              <p className="text-gray-400 text-[13px]">{profile?.phone}</p>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                profile?.status === "online" ? "bg-green-100 text-green-600"
                : profile?.status === "busy" ? "bg-orange-100 text-orange-500"
                : "bg-gray-100 text-gray-400"
              }`}>
                {profile?.status === "online" ? "🟢 Online"
                 : profile?.status === "busy" ? "🟠 Busy"
                 : "⚫ Offline"}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-[13px] text-gray-400">{uz ? "To'lov usuli:" : "Payment:"}</span>
            <span className="text-[13px] font-bold text-gray-700">
              {profile?.payment_method === "cash"
                ? (uz ? "💵 Naqd pul" : "💵 Cash")
                : (uz ? "🏦 Bank o'tkazma" : "🏦 Bank transfer")}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Earnings */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {uz ? "Daromad" : "Earnings"}
            </p>
            <p className="text-[24px] font-extrabold text-[#F97316]">
              ₩{netEarnings.toLocaleString()}
            </p>
            {(profile?.penalty_krw ?? 0) > 0 && (
              <p className="text-[11px] text-red-400 mt-0.5">
                -{(profile?.penalty_krw ?? 0).toLocaleString()} {uz ? "jarima" : "penalty"}
              </p>
            )}
          </div>

          {/* Order count */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {uz ? "Buyurtmalar" : "Orders"}
            </p>
            <p className="text-[24px] font-extrabold text-gray-900">
              {profile?.orders_completed ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {uz ? "bajarildi" : "completed"}
            </p>
          </div>
        </div>

        {/* Earnings breakdown */}
        {deliveries.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wide">
                {uz ? "So'nggi yetkazishlar" : "Recent deliveries"}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {deliveries.slice(0, 10).map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      #{d.order_id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(d.delivered_at).toLocaleDateString("ko-KR", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                      {d.distance_km != null && ` · ${d.distance_km.toFixed(1)}km`}
                    </p>
                  </div>
                  <span className="text-[14px] font-extrabold text-[#F97316]">
                    +₩{d.fee_krw.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank info */}
        {profile?.payment_method === "bank" && (profile?.bank_name || profile?.bank_account_number) && (
          <div className="bg-white rounded-2xl p-4 space-y-1 border border-gray-100 shadow-sm">
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {uz ? "Bank ma'lumotlari" : "Bank details"}
            </p>
            <p className="text-gray-900 font-semibold">{profile.bank_name}</p>
            <p className="text-gray-500 font-mono">{profile.bank_account_number}</p>
          </div>
        )}

        {/* Links */}
        <div className="bg-white rounded-2xl divide-y divide-gray-100 border border-gray-100 shadow-sm">
          <button onClick={() => router.push("/menu")}
            className="flex items-center justify-between w-full px-5 py-4 text-[15px] text-gray-500">
            <span>{uz ? "Mijoz rejimiga o'tish" : "Switch to customer mode"}</span>
            <span className="text-gray-300">→</span>
          </button>
        </div>

        <button onClick={handleSignOut}
          className="w-full rounded-2xl border border-red-200 text-red-500 font-bold text-[15px] py-3.5">
          {t("profile.signOut")}
        </button>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-[640px] mx-auto flex h-[62px]">
          {[
            { href: "/rider/orders", icon: "📋", label: uz ? "Buyurtmalar" : "Orders", active: false },
            { href: "/rider/profile", icon: "👤", label: uz ? "Profil" : "Profile", active: true },
          ].map(({ href, icon, label, active }) => (
            <a key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-1">
              <span className="text-xl">{icon}</span>
              <span className={`text-[11px] font-bold ${active ? "text-[#F97316]" : "text-gray-400"}`}>{label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
