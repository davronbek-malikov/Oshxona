"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

const TrackMap = dynamic(() => import("@/components/checkout/DeliveryMap"), { ssr: false });

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: "🏍️", bicycle: "🚲", car: "🚗", walking: "🚶",
};

interface TrackData {
  order: {
    id: string; status: string; rider_status: string | null;
    delivery_lat: number | null; delivery_lng: number | null;
    delivery_address: string;
  };
  rider: {
    id: string; name: string; phone: string; vehicle: string;
    current_lat: number | null; current_lng: number | null; status: string;
  } | null;
  restaurant: { name_uz: string; address: string } | null;
}

export default function OrderTrackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const uz = lang === "uz";
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${params.id}/track`);
    if (!res.ok) return;
    const d = await res.json();
    setData(d);
    setLoading(false);
    // Stop polling once delivered
    if (d.order?.rider_status === "delivered") {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [params.id]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 15000); // refresh every 15s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#059669]/30 border-t-[#059669] rounded-full animate-spin" />
    </div>
  );

  const { order, rider, restaurant } = data ?? {};

  const STATUS_LABELS: Record<string, string> = {
    accepted:  uz ? "Kuryer yo'lda (restoranga)" : "Rider heading to restaurant",
    picked_up: uz ? "Ovqat olib ketildi — sizga kelmoqda" : "Food picked up — on the way",
    delivered: uz ? "Yetkazib berildi ✅" : "Delivered ✅",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          ←
        </button>
        <h1 className="font-bold text-[17px]">
          {uz ? "Buyurtmani kuzatish" : "Track Order"}
        </h1>
        <span className="ml-auto text-[12px] text-gray-400">
          #{order?.id.slice(-6).toUpperCase()}
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Status banner */}
        <div className={`rounded-2xl p-4 text-center font-bold text-[15px] ${
          order?.rider_status === "delivered"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-orange-50 text-[#F97316] border border-orange-200"
        }`}>
          {order?.rider_status
            ? STATUS_LABELS[order.rider_status] ?? order.rider_status
            : (uz ? "Kuryer kutilmoqda..." : "Waiting for rider...")}
        </div>

        {/* Map — shows rider pin + destination */}
        {order?.delivery_lat && order?.delivery_lng && (
          <div className="rounded-2xl overflow-hidden h-56 border border-gray-100 shadow-sm">
            <TrackMap
              lat={rider?.current_lat ?? order.delivery_lat}
              lng={rider?.current_lng ?? order.delivery_lng}
            />
          </div>
        )}

        {/* Rider info */}
        {rider ? (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">
              {uz ? "Kuryeringiz" : "Your Rider"}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl">
                  {VEHICLE_ICONS[rider.vehicle] ?? "🛵"}
                </div>
                <div>
                  <p className="font-bold text-[16px] text-gray-900">{rider.name}</p>
                  <p className="text-[13px] text-gray-400">{rider.vehicle}</p>
                </div>
              </div>
              <a href={`tel:${rider.phone}`}
                className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 text-xl">
                📞
              </a>
            </div>
            <p className="text-[12px] text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {uz ? "15 soniyada yangilanadi" : "Updates every 15 seconds"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-gray-400 text-[14px]">
              {uz ? "Kuryer hali tayinlanmagan" : "No rider assigned yet"}
            </p>
          </div>
        )}

        {/* Restaurant */}
        {restaurant && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
            <p className="text-[12px] font-bold text-[#F97316] uppercase tracking-wide">🏪 {uz ? "Restoran" : "Restaurant"}</p>
            <p className="font-bold text-gray-900">{restaurant.name_uz}</p>
            <p className="text-[13px] text-gray-400">{restaurant.address}</p>
          </div>
        )}

        {/* Destination */}
        {order?.delivery_address && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
            <p className="text-[12px] font-bold text-green-600 uppercase tracking-wide">📦 {uz ? "Yetkazish manzili" : "Delivery address"}</p>
            <p className="text-[14px] text-gray-900 leading-relaxed">{order.delivery_address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
