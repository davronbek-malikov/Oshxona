"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import { MenuItemCard } from "@/components/restaurant/MenuItemCard";
import type { Database } from "@/types/database";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuCategory = Database["public"]["Tables"]["menu_items"]["Row"]["category"];

const CATEGORIES: Array<{ value: MenuCategory | "all"; label: string }> = [
  { value: "all", label: "Hammasi" },
  { value: "tovuq", label: "🍗 Tovuq" },
  { value: "kabob", label: "🥩 Kabob" },
  { value: "somsa", label: "🥟 Somsa" },
  { value: "osh", label: "🍚 Osh" },
  { value: "salat", label: "🥗 Salat" },
  { value: "ichimlik", label: "🥤 Ichimlik" },
  { value: "shirinlik", label: "🍰 Shirinlik" },
];

function isOpen(opening: string | null | undefined, closing: string | null | undefined) {
  if (!opening || !closing) return null;
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return hhmm >= opening && hhmm <= closing;
}

export default function RestaurantMenuPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const restaurantId = params.restaurantId;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MenuCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showClearPrompt, setShowClearPrompt] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  const { addItem, clearCart, itemCount, restaurantId: cartRestaurantId } = useCartStore();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: r } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();
      setRestaurant(r);

      const { data: m } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("category")
        .order("name_uz");
      setItems(m ?? []);
      setLoading(false);
    }
    load();
  }, [restaurantId]);

  function handleAdd(item: MenuItem) {
    if (!restaurant) return;
    const added = addItem(restaurant.id, restaurant.name_uz, {
      id: item.id,
      name_uz: item.name_uz,
      price_krw: item.price_krw,
      photo_url: item.photo_url,
    });
    if (!added) {
      setPendingItem(item);
      setShowClearPrompt(true);
    }
  }

  function confirmClearCart() {
    if (!restaurant || !pendingItem) return;
    clearCart();
    addItem(restaurant.id, restaurant.name_uz, {
      id: pendingItem.id,
      name_uz: pendingItem.name_uz,
      price_krw: pendingItem.price_krw,
      photo_url: pendingItem.photo_url,
    });
    setPendingItem(null);
    setShowClearPrompt(false);
  }

  const visible = items.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchSearch =
      !search.trim() ||
      item.name_uz.toLowerCase().includes(search.toLowerCase()) ||
      item.name_en?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Available categories that have items
  const usedCategories = CATEGORIES.filter(
    (c) =>
      c.value === "all" ||
      items.some((i) => i.category === c.value)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Restoran topilmadi.</p>
        <Link href="/menu" className="text-primary underline mt-2 block">
          ← Orqaga
        </Link>
      </div>
    );
  }

  const open = isOpen(restaurant.opening_time, restaurant.closing_time);

  return (
    <div className="space-y-4 pb-28">
      {/* Back + header */}
      <div className="flex items-center gap-3 -mx-4 px-4 py-2 bg-white sticky top-[72px] z-30 border-b">
        <button onClick={() => router.back()} className="text-2xl">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{restaurant.name_uz}</h1>
          {restaurant.address && (
            <p className="text-xs text-muted-foreground truncate">
              {restaurant.address}
            </p>
          )}
        </div>
        {open !== null && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
              open
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {open ? "Ochiq" : "Yopiq"}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Taom qidirish..."
          className="w-full h-11 pl-11 pr-4 rounded-2xl border border-input bg-white text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {usedCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-colors ${
              activeCategory === cat.value
                ? "bg-primary text-white"
                : "bg-white border border-border text-muted-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {visible.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-4xl">🍽️</span>
          <p className="text-muted-foreground mt-3">Taom topilmadi</p>
        </div>
      )}
      <div className="space-y-3">
        {visible.map((item) => (
          <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
        ))}
      </div>

      {/* Clear cart prompt */}
      {showClearPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-[640px] space-y-4">
            <h3 className="font-bold text-lg">Savatni tozalash kerak</h3>
            <p className="text-muted-foreground text-sm">
              Savatchada boshqa restoran mahsulotlari bor. Yangi restorandan
              qo'shish uchun savatni tozalaysizmi?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearPrompt(false)}
                className="flex-1 h-12 border border-border rounded-xl font-semibold"
              >
                Bekor
              </button>
              <button
                onClick={confirmClearCart}
                className="flex-1 h-12 bg-primary text-white rounded-xl font-semibold"
              >
                Ha, tozalash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating cart button */}
      {itemCount() > 0 && cartRestaurantId === restaurantId && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-4">
          <div className="max-w-[640px] mx-auto">
            <Link
              href="/cart"
              className="flex items-center justify-between w-full h-14 bg-primary text-white rounded-2xl px-5 shadow-lg"
            >
              <span className="bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-sm">
                {itemCount()}
              </span>
              <span className="font-bold">Savatga o'tish</span>
              <span className="font-bold">
                ₩{useCartStore.getState().total().toLocaleString()}
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
