"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import { MenuItemCard } from "@/components/restaurant/MenuItemCard";
import { AISearchButton } from "@/components/ai/AISearchButton";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();
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
    const supabase = createClient();

    async function load() {
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

    // Realtime: reflect availability changes instantly (sold-out, hidden)
    const channel = supabase
      .channel(`menu-availability-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "menu_items",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === (payload.new as MenuItem).id
                ? { ...item, ...(payload.new as MenuItem) }
                : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("menu.notFound")}</p>
        <Link href="/menu" className="text-primary underline mt-2 block">
          ← {t("common.back")}
        </Link>
      </div>
    );
  }

  const open = isOpen(restaurant.opening_time, restaurant.closing_time);

  return (
    <div className="space-y-4 pb-28">
      {/* Back + header */}
      <div className="flex items-center gap-3 -mx-4 px-4 py-3 bg-white sticky top-[68px] z-30 border-b border-[#EEEEEE]">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#111] font-bold text-lg flex-shrink-0"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-[18px] text-[#111] truncate leading-tight">
            {restaurant.name_uz}
          </h1>
          {restaurant.address && (
            <p className="text-[12px] text-[#AAAAAA] truncate mt-0.5">
              {restaurant.address}
            </p>
          )}
        </div>
        {open !== null && (
          <span
            className={`text-[13px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${
              open
                ? "bg-green-50 text-green-600"
                : "bg-[#F5F5F5] text-[#AAAAAA]"
            }`}
          >
            {open ? t("restaurant.open") : t("restaurant.closed")}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB] text-base">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search") + "..."}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white text-[15px] text-[#111] placeholder:text-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-none"
          style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
        />
      </div>

      {/* Category tabs — minimal underline style */}
      <div className="flex gap-0 overflow-x-auto -mx-4 px-4 border-b border-[#EEEEEE]">
        {usedCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex-shrink-0 px-4 py-3 text-[14px] font-bold transition-colors whitespace-nowrap border-b-2 -mb-[1px] ${
              activeCategory === cat.value
                ? "border-primary text-primary"
                : "border-transparent text-[#AAAAAA]"
            }`}
          >
            {cat.value === "all" ? t("restaurant.allCategories") : cat.label}
          </button>
        ))}
      </div>

      {/* Items — single white container with dividers */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center">
          <span className="text-4xl">🍽️</span>
          <p className="text-[#AAAAAA] mt-3 text-[15px]">{t("menu.notFound")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#F2F2F2]">
          {visible.map((item) => (
            <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
          ))}
        </div>
      )}

      {/* Clear cart prompt */}
      {showClearPrompt && (
        <div className="fixed inset-0 z-[62] flex items-end justify-center bg-black/50">
          <div className="bg-white rounded-t-3xl p-6 pb-10 w-full max-w-[640px] space-y-4">
            <h3 className="font-bold text-lg">{t("restaurant.clearCartTitle")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("restaurant.clearCartMsg")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearPrompt(false)}
                className="flex-1 h-12 border border-border rounded-xl font-semibold"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmClearCart}
                className="flex-1 h-12 bg-primary text-white rounded-xl font-semibold"
              >
                {t("restaurant.clearAndAdd")}
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
              <span className="font-bold">{t("cart.checkout")}</span>
              <span className="font-bold">
                ₩{useCartStore.getState().total().toLocaleString()}
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* AI Search floating button */}
      {!loading && items.length > 0 && (
        <AISearchButton
          menuContext={{
            restaurantId: restaurant.id,
            restaurantName: restaurant.name_uz,
            items: items.map((i) => ({
              id: i.id,
              name_uz: i.name_uz,
              name_en: i.name_en,
              category: i.category,
              price_krw: i.price_krw,
            })),
          }}
        />
      )}
    </div>
  );
}
