"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { items, restaurantId, total, clearCart, itemCount } = useCartStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">(
    "pickup"
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<"account" | "amount" | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      router.replace("/cart");
      return;
    }
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId!)
        .single();
      setRestaurant(data);
    }
    load();
  }, [restaurantId, router]);

  async function uploadReceipt(file: File): Promise<string | null> {
    const supabase = createClient();
    const path = `${user?.id ?? "anon"}/${Date.now()}.${file.name.split(".").pop()}`;
    const { data } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: true });
    if (!data) return null;
    return data.path;
  }

  async function handleSubmit() {
    if (!user || !restaurant || itemCount() === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          items: items.map((i) => ({
            menu_item_id: i.id,
            quantity: i.quantity,
            price_at_order: i.price_krw,
          })),
          total_krw: total(),
          delivery_type: deliveryType,
          delivery_address: deliveryType === "delivery" ? deliveryAddress : null,
          customer_note: note || null,
          payment_receipt_url: receiptUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        clearCart();
        router.replace(`/orders/${data.id}`);
      } else {
        alert(data.error ?? "Xatolik yuz berdi");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function copy(text: string, which: "account" | "amount") {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!restaurant || itemCount() === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-xl font-bold">Buyurtma berish</h1>

      {/* Order summary */}
      <div className="bg-white rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold">📋 Buyurtma tarkibi</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name_uz} × {item.quantity}
            </span>
            <span className="font-medium">
              ₩{(item.price_krw * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t pt-2 mt-2">
          <span>Jami</span>
          <span className="text-primary text-lg">₩{total().toLocaleString()}</span>
        </div>
      </div>

      {/* Delivery type */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">🚴 Yetkazib berish turi</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryType("pickup")}
            className={`h-14 rounded-xl border-2 font-semibold text-sm transition-colors ${
              deliveryType === "pickup"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            🏃 Olib ketish
            <br />
            <span className="text-xs font-normal">Pickup</span>
          </button>
          <button
            onClick={() => setDeliveryType("delivery")}
            className={`h-14 rounded-xl border-2 font-semibold text-sm transition-colors ${
              deliveryType === "delivery"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            🛵 Yetkazib berish
            <br />
            <span className="text-xs font-normal">Delivery</span>
          </button>
        </div>

        {deliveryType === "delivery" && (
          <div>
            <label className="block text-sm font-semibold mb-1">
              Yetkazib berish manzili
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="To'liq manzilni kiriting..."
              className="w-full rounded-xl border border-input px-3 py-3 text-base min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="masalan: Oshga yog' kamroq..."
            className="w-full h-11 rounded-xl border border-input px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Bank transfer info */}
      <div className="bg-white rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-lg">💳 To'lov / Payment</h2>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">Ko'rsatma / Instructions:</p>
          <p>1. Bank ilovasini oching va quyidagi hisob raqamiga o'tkazma qiling.</p>
          <p>2. Skrinshot oling yoki "Yubordim" tugmasini bosing.</p>
          <p className="text-xs mt-1 text-amber-600">
            Open your banking app, transfer to the account below, then tap "I
            have sent".
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Bank</p>
              <p className="font-bold">{restaurant.bank_name}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Hisob raqami</p>
              <p className="font-bold font-mono text-lg">
                {restaurant.bank_account_number}
              </p>
              <p className="text-xs text-muted-foreground">
                {restaurant.bank_account_holder}
              </p>
            </div>
            <button
              onClick={() =>
                copy(restaurant.bank_account_number ?? "", "account")
              }
              className="h-10 px-4 bg-primary/10 text-primary rounded-xl text-sm font-semibold"
            >
              {copied === "account" ? "✓ Ko'chirildi" : "Nusxa"}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
            <div>
              <p className="text-xs text-muted-foreground">To'lov miqdori</p>
              <p className="font-bold text-2xl text-primary">
                ₩{total().toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => copy(total().toString(), "amount")}
              className="h-10 px-4 bg-primary/10 text-primary rounded-xl text-sm font-semibold"
            >
              {copied === "amount" ? "✓ Ko'chirildi" : "Nusxa"}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt upload */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">📸 Chek yuklash (ixtiyoriy)</h2>
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-2xl p-5 text-center hover:border-primary transition-colors">
            {receiptUrl ? (
              <p className="text-green-600 font-semibold">✅ Chek yuklandi</p>
            ) : (
              <div>
                <span className="text-3xl">📷</span>
                <p className="text-sm text-muted-foreground mt-1">
                  To'lov cheki skrinshoti yuklang
                </p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const path = await uploadReceipt(file);
                setReceiptUrl(path);
              }
            }}
          />
        </label>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || (deliveryType === "delivery" && !deliveryAddress.trim())}
        className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Yuklanmoqda..." : "✅ Yubordim / I have sent"}
      </button>
    </div>
  );
}
