"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

const DeliveryMap = dynamic(() => import("@/components/checkout/DeliveryMap"), { ssr: false });

interface OrderDetail {
  id: string;
  total_krw: number;
  rider_fee_krw: number;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  customer_note: string | null;
  customer_phone: string | null;
  created_at: string;
  status: string;
  rider_status: string | null;
  rider_id: string | null;
  restaurants: {
    id: string; name_uz: string; address: string;
    phone: string | null; bank_name: string | null;
    bank_account_number: string | null;
  } | null;
  order_items: Array<{
    id: string; quantity: number; price_at_order: number;
    menu_items: { name_uz: string } | null;
  }>;
}

function useElapsed(from: string | null) {
  const [elapsed, setElapsed] = useState("");
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!from) return;
    function update() {
      const secs = Math.floor((Date.now() - new Date(from!).getTime()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${String(s).padStart(2, "0")}`);
    }
    update();
    ref.current = setInterval(update, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [from]);

  return elapsed;
}

function getElapsedMinutes(from: string) {
  return Math.floor((Date.now() - new Date(from).getTime()) / 60000);
}

export default function RiderOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const uz = lang === "uz";
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const locationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Send GPS location every 20s while order is active
  const startTracking = useCallback(() => {
    function send() {
      navigator.geolocation?.getCurrentPosition((pos) => {
        fetch("/api/rider/location", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      });
    }
    send();
    locationRef.current = setInterval(send, 20000);
  }, []);

  const stopTracking = useCallback(() => {
    if (locationRef.current) { clearInterval(locationRef.current); locationRef.current = null; }
  }, []);

  useEffect(() => () => stopTracking(), [stopTracking]);

  const elapsed = useElapsed(acceptedAt ?? (
    order?.rider_status === "accepted" || order?.rider_status === "picked_up"
      ? order?.created_at ?? null
      : null
  ));

  useEffect(() => {
    // Use admin-side API to get customer phone (bypasses RLS)
    fetch(`/api/rider/orders/${params.id}/detail`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setOrder(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function doAction(action: "accept" | "pickup" | "deliver") {
    setActing(true);
    setError("");
    try {
      const res = await fetch(`/api/rider/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      if (action === "accept") {
        setAcceptedAt(new Date().toISOString());
        setOrder((o) => o ? { ...o, rider_status: "accepted" } : o);
        startTracking();
      } else if (action === "pickup") {
        setOrder((o) => o ? { ...o, rider_status: "picked_up" } : o);
      } else if (action === "deliver") {
        stopTracking();
        router.replace("/rider/orders");
      }
    } catch { setError(uz ? "Internet aloqasini tekshiring" : "Check your connection"); }
    finally { setActing(false); }
  }

  function openNavigation(type: "google" | "kakao") {
    if (!order) return;
    if (type === "google") {
      if (order.delivery_lat && order.delivery_lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`, "_blank");
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`, "_blank");
      }
    } else {
      window.open(`https://map.kakao.com/link/to/${encodeURIComponent(order.delivery_address)},${order.delivery_lat ?? ""},${order.delivery_lng ?? ""}`, "_blank");
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400">{uz ? "Buyurtma topilmadi" : "Order not found"}</p>
    </div>
  );

  const isActive = order.rider_status === "accepted" || order.rider_status === "picked_up";
  const elapsedMins = isActive ? getElapsedMinutes(acceptedAt ?? order.created_at) : 0;
  const isLate = elapsedMins > 30;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
          ←
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">#{order.id.slice(-6).toUpperCase()}</h1>

        {/* Live timer */}
        {isActive && (
          <div className={`ml-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold ${
            isLate ? "bg-red-100 text-red-600" : "bg-orange-50 text-[#F97316]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${isLate ? "animate-pulse" : ""}`} />
            {elapsed}
            {isLate && <span className="ml-0.5 text-[11px]">{uz ? "Kech!" : "Late!"}</span>}
          </div>
        )}

        <span className="ml-auto text-[13px] font-bold text-[#F97316]">
          ₩{(order.rider_fee_krw ?? 3000).toLocaleString()} {uz ? "haq" : "fee"}
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Pickup — Restaurant */}
        <div className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100 shadow-sm">
          <p className="text-[12px] font-bold text-[#F97316] uppercase tracking-wide">
            🏪 {t("rider.from")}
          </p>
          <p className="font-extrabold text-[17px] text-gray-900">{order.restaurants?.name_uz}</p>
          <p className="text-[13px] text-gray-500">{order.restaurants?.address}</p>
          {order.restaurants?.phone && (
            <a href={`tel:${order.restaurants.phone}`}
              className="inline-flex items-center gap-1.5 text-[#F97316] text-[13px] font-bold">
              📞 {order.restaurants.phone}
            </a>
          )}
        </div>

        {/* Delivery — Customer */}
        <div className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100 shadow-sm">
          <p className="text-[12px] font-bold text-green-600 uppercase tracking-wide">
            📦 {t("rider.to")}
          </p>
          <p className="text-[15px] text-gray-900 leading-relaxed">{order.delivery_address}</p>
          {order.customer_note && (
            <p className="text-[13px] text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              📝 {order.customer_note}
            </p>
          )}
          {order.customer_phone && (
            <a href={`tel:${order.customer_phone}`}
              className="inline-flex items-center gap-1.5 text-green-600 text-[13px] font-bold">
              📞 {order.customer_phone}
            </a>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => openNavigation("google")}
              className="flex-1 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-[13px] font-bold flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              Google Maps
            </button>
            <button onClick={() => openNavigation("kakao")}
              className="flex-1 h-10 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-[13px] font-bold flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              Kakao Map
            </button>
          </div>
        </div>

        {/* Map */}
        {order.delivery_lat && order.delivery_lng && (
          <div className="rounded-2xl overflow-hidden h-48 border border-gray-100 shadow-sm">
            <DeliveryMap lat={order.delivery_lat} lng={order.delivery_lng} />
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100 shadow-sm">
          <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            {uz ? "Buyurtma tarkibi" : "Order items"}
          </p>
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-[14px]">
              <span className="text-gray-500">{item.menu_items?.name_uz} ×{item.quantity}</span>
              <span className="text-gray-900 font-medium">₩{(item.price_at_order * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-gray-100 pt-2 mt-1">
            <span className="text-gray-400">{uz ? "Jami" : "Total"}</span>
            <span className="text-gray-900">₩{order.total_krw.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-[14px]">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-[640px] mx-auto space-y-2">
          {!order.rider_id && order.status === "ready" && (
            <button onClick={() => doAction("accept")} disabled={acting}
              className="w-full h-14 rounded-2xl bg-[#F97316] text-white font-extrabold text-[17px] disabled:opacity-50 active:scale-[0.98] transition-transform">
              {acting ? "..." : `✓ ${t("rider.accept")}`}
            </button>
          )}
          {order.rider_status === "accepted" && (
            <button onClick={() => doAction("pickup")} disabled={acting}
              className="w-full h-14 rounded-2xl bg-blue-500 text-white font-extrabold text-[17px] disabled:opacity-50 active:scale-[0.98] transition-transform">
              {acting ? "..." : `📦 ${t("rider.pickup")}`}
            </button>
          )}
          {order.rider_status === "picked_up" && (
            <button onClick={() => doAction("deliver")} disabled={acting}
              className="w-full h-14 rounded-2xl bg-green-500 text-white font-extrabold text-[17px] disabled:opacity-50 active:scale-[0.98] transition-transform">
              {acting ? "..." : `🛵 ${t("rider.deliver")}`}
            </button>
          )}
          {order.rider_status === "delivered" && (
            <div className="w-full h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold text-[16px]">
              ✅ {uz ? "Yetkazib berildi" : "Delivered"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
