"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export default function RestaurantMenuPage() {
  const { user } = useCurrentUser();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data: r } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user!.id)
        .single();

      if (!r) { setLoading(false); return; }
      setRestaurantId(r.id);

      const { data: m } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", r.id)
        .order("created_at");

      setItems(m ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function toggleAvailable(item: MenuItem) {
    const supabase = createClient();
    const newValue = !item.is_available;
    await supabase
      .from("menu_items")
      .update({ is_available: newValue })
      .eq("id", item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: newValue } : i))
    );
  }

  async function toggleSoldOut(item: MenuItem) {
    const supabase = createClient();
    const newValue = !item.sold_out_today;
    await supabase
      .from("menu_items")
      .update({ sold_out_today: newValue })
      .eq("id", item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, sold_out_today: newValue } : i
      )
    );
  }

  async function deleteItem(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    const supabase = createClient();
    await supabase.from("menu_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="text-center py-16 space-y-4">
        <span className="text-6xl">🏪</span>
        <p className="text-muted-foreground">Avval restoraningizni ro'yxatdan o'tkazing.</p>
        <Link
          href="/restaurant/onboarding"
          className="inline-flex h-12 px-6 bg-primary text-white rounded-xl items-center font-semibold"
        >
          Ro'yxatdan o'tish →
        </Link>
      </div>
    );
  }

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category ?? "boshqa";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Menyu</h1>
        <Link
          href="/restaurant/menu/add"
          className="flex items-center gap-1 h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold"
        >
          + Qo'shish
        </Link>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-5xl">🍽️</span>
          <p className="font-semibold mt-3">Menyu bo'sh</p>
          <p className="text-muted-foreground text-sm mt-1">
            Birinchi taomingizni qo'shing
          </p>
          <Link
            href="/restaurant/menu/add"
            className="inline-flex h-12 px-6 bg-primary text-white rounded-xl items-center font-semibold mt-4"
          >
            + Taom qo'shish
          </Link>
        </div>
      )}

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category}>
          <h2 className="font-semibold text-muted-foreground text-sm uppercase mb-2 px-1">
            {category}
          </h2>
          <div className="space-y-2">
            {catItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 flex gap-3 ${
                  !item.is_available || item.sold_out_today ? "opacity-60" : ""
                }`}
              >
                {item.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photo_url}
                    alt={item.name_uz}
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.name_uz}</p>
                  <p className="text-primary font-bold">
                    ₩{item.price_krw.toLocaleString()}
                  </p>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {/* Available toggle */}
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`h-7 px-3 rounded-full text-xs font-semibold border transition-colors ${
                        item.is_available
                          ? "bg-green-100 border-green-200 text-green-700"
                          : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}
                    >
                      {item.is_available ? "✓ Mavjud" : "✗ Yopiq"}
                    </button>

                    {/* Sold out today */}
                    <button
                      onClick={() => toggleSoldOut(item)}
                      className={`h-7 px-3 rounded-full text-xs font-semibold border transition-colors ${
                        item.sold_out_today
                          ? "bg-red-100 border-red-200 text-red-700"
                          : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}
                    >
                      {item.sold_out_today ? "🔴 Tugagan" : "Bugun bor"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/restaurant/menu/edit/${item.id}`}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary text-sm"
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:text-destructive text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
