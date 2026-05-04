"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";

const RestaurantMap = dynamic(
  () => import("@/components/map/RestaurantMap"),
  { ssr: false }
);

interface NearbyRestaurant {
  id: string;
  name_uz: string;
  name_en: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  photos: string[];
  opening_time: string | null;
  closing_time: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  distance_km: number;
  lat?: number;
  lng?: number;
}

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

export default function MenuPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locationDenied, setLocationDenied] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");

  // Role picker redirect
  useEffect(() => {
    if (userLoading) return;
    const confirmed = localStorage.getItem("oshxona_role_confirmed");
    if (!confirmed && user) {
      router.replace("/role-picker");
    }
    if (user?.role === "restaurant") {
      router.replace("/restaurant/dashboard");
    }
  }, [user, userLoading, router]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      loadRestaurants(DEFAULT_LAT, DEFAULT_LNG);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        loadRestaurants(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationDenied(true);
        loadRestaurants(DEFAULT_LAT, DEFAULT_LNG);
      },
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRestaurants(userLat: number, userLng: number) {
    setFetching(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("restaurants_near", {
      lat: userLat,
      lng: userLng,
      radius_km: 30,
    });
    if (!error && data) {
      setRestaurants(data as NearbyRestaurant[]);
    }
    setFetching(false);
  }

  const filtered = search.trim()
    ? restaurants.filter(
        (r) =>
          r.name_uz.toLowerCase().includes(search.toLowerCase()) ||
          r.name_en?.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : restaurants;

  return (
    <div className="space-y-4">
      {/* Location denied banner */}
      {locationDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          📍 Joylashuvga ruxsat bering — aniqroq natijalar uchun.
          <span className="text-xs block text-amber-600 mt-0.5">
            Please enable location for better results.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Restoran qidirish... / Search restaurants"
          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-input bg-white text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* View toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setView("list")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
            view === "list"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          📋 Ro'yxat
        </button>
        <button
          onClick={() => setView("map")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
            view === "map"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          🗺️ Xarita
        </button>
      </div>

      {/* Loading */}
      {fetching && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Yaqin restoranlar qidirilmoqda...
          </p>
        </div>
      )}

      {/* Empty */}
      {!fetching && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center">
          <span className="text-5xl">🍽️</span>
          <p className="font-semibold mt-3">Restoran topilmadi</p>
          <p className="text-muted-foreground text-sm mt-1">
            {search
              ? "Boshqa so'z bilan urinib ko'ring"
              : "Hozircha yaqin atrofda restoran yo'q"}
          </p>
        </div>
      )}

      {/* List view */}
      {!fetching && view === "list" && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((r) => (
            <RestaurantCard
              key={r.id}
              id={r.id}
              name_uz={r.name_uz}
              description={r.description}
              address={r.address}
              distance_km={r.distance_km}
              photos={r.photos}
              opening_time={r.opening_time}
              closing_time={r.closing_time}
            />
          ))}
        </div>
      )}

      {/* Map view */}
      {!fetching && view === "map" && filtered.length > 0 && (
        <RestaurantMap
          userLat={lat}
          userLng={lng}
          restaurants={filtered.map((r) => ({
            id: r.id,
            name_uz: r.name_uz,
            lat: r.lat ?? lat,
            lng: r.lng ?? lng,
            distance_km: r.distance_km,
          }))}
        />
      )}

      {/* Restaurant owner link */}
      {user && user.role === "customer" && (
        <div className="text-center py-2">
          <Link
            href="/role-picker"
            className="text-sm text-muted-foreground underline"
          >
            Restoran egasimisiz? →
          </Link>
        </div>
      )}
    </div>
  );
}
