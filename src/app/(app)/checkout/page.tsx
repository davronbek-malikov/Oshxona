"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCartStore } from "@/store/cart";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import type { Database } from "@/types/database";

const DeliveryMap = dynamic(() => import("@/components/checkout/DeliveryMap"), { ssr: false });

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];

const DELIVERY_MINIMUM_KRW = 15000;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { items, restaurantId, total, clearCart, itemCount } = useCartStore();
  const { lang } = useLanguage();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<"account" | "amount" | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!restaurantId) { router.replace("/cart"); return; }
    const supabase = createClient();
    supabase.from("restaurants").select("*").eq("id", restaurantId!).single()
      .then(({ data }) => setRestaurant(data));
  }, [restaurantId, router]);

  // Geocode address after 800ms pause
  useEffect(() => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (deliveryAddress.trim().length < 10) { setDeliveryCoords(null); return; }
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`,
          { headers: { "Accept-Language": "ko,en" } }
        );
        const data = await res.json();
        if (data[0]) {
          setDeliveryCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch { /* ignore */ }
      setGeocoding(false);
    }, 800);
  }, [deliveryAddress]);

  async function uploadReceipt(file: File): Promise<string | null> {
    setUploadingReceipt(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user?.id ?? "anon"}/${Date.now()}.${ext}`;
      const { data } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      return data?.path ?? null;
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function handleSubmit() {
    if (!user || !restaurant || itemCount() === 0) return;

    // Validations
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      alert(lang === "uz" ? "Iltimos manzil kiriting" : "Please enter delivery address");
      return;
    }
    if (deliveryType === "delivery" && total() < DELIVERY_MINIMUM_KRW) return;
    if (!paymentConfirmed && !receiptUrl) {
      alert(lang === "uz"
        ? "Iltimos to'lovni tasdiqlang yoki chek yuklang"
        : "Please confirm payment or upload receipt");
      return;
    }

    setSubmitting(true);
    try {
      let finalReceiptUrl = receiptUrl;
      if (receiptFile && !receiptUrl) {
        finalReceiptUrl = await uploadReceipt(receiptFile);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
          delivery_type: deliveryType,
          delivery_address: deliveryType === "delivery" ? deliveryAddress : null,
          delivery_lat: deliveryCoords?.lat ?? null,
          delivery_lng: deliveryCoords?.lng ?? null,
          customer_note: note || null,
          payment_receipt_url: finalReceiptUrl,
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
    return <div className="flex items-center justify-center h-64">
      <p className="text-[#AAAAAA]">Yuklanmoqda...</p>
    </div>;
  }

  const belowMinimum = deliveryType === "delivery" && total() < DELIVERY_MINIMUM_KRW;
  const canSubmit = !submitting && !belowMinimum &&
    (deliveryType === "pickup" || deliveryAddress.trim()) &&
    (paymentConfirmed || !!receiptUrl);

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-[22px] font-extrabold text-[#111]">
        {lang === "uz" ? "Buyurtma berish" : "Checkout"}
      </h1>

      {/* Order summary */}
      <div className="bg-white rounded-2xl p-4 space-y-2">
        <h2 className="font-bold text-[16px]">📋 {lang === "uz" ? "Buyurtma tarkibi" : "Order summary"}</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-[14px]">
            <span className="text-[#555]">{item.name_uz} × {item.quantity}</span>
            <span className="font-bold text-[#111]">₩{(item.price_krw * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-extrabold border-t border-[#F2F2F2] pt-2 mt-1">
          <span className="text-[#111]">{lang === "uz" ? "Jami" : "Total"}</span>
          <span className="text-primary text-[20px]">₩{total().toLocaleString()}</span>
        </div>
      </div>

      {/* Delivery type */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="font-bold text-[16px]">🚴 {lang === "uz" ? "Yetkazib berish turi" : "Delivery type"}</h2>
        <div className="grid grid-cols-2 gap-3">
          {(["pickup", "delivery"] as const).map((type) => (
            <button key={type} onClick={() => setDeliveryType(type)}
              className={`h-16 rounded-2xl border-2 font-bold text-[14px] transition-colors ${
                deliveryType === type ? "border-primary bg-primary/5 text-primary" : "border-[#EEEEEE] text-[#AAAAAA]"
              }`}>
              {type === "pickup" ? "🏃" : "🛵"}<br />
              <span>{type === "pickup"
                ? (lang === "uz" ? "Olib ketish" : "Pickup")
                : (lang === "uz" ? "Yetkazib berish" : "Delivery")}
              </span>
            </button>
          ))}
        </div>

        {/* Delivery minimum warning */}
        {deliveryType === "delivery" && (
          <div className={`rounded-2xl px-4 py-3 text-[13px] ${
            belowMinimum ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"
          }`}>
            {belowMinimum
              ? `⚠️ ${lang === "uz"
                  ? `Yetkazib berish uchun minimal buyurtma: ₩${DELIVERY_MINIMUM_KRW.toLocaleString()}. Hozirgi jami: ₩${total().toLocaleString()}`
                  : `Minimum order for delivery: ₩${DELIVERY_MINIMUM_KRW.toLocaleString()}. Current total: ₩${total().toLocaleString()}`}`
              : `✓ ${lang === "uz" ? "Yetkazib berish uchun minimal summa yetarli" : "Meets minimum delivery amount"}`}
          </div>
        )}

        {/* Delivery address */}
        {deliveryType === "delivery" && (
          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#888] uppercase tracking-wide">
              {lang === "uz" ? "Yetkazib berish manzili" : "Delivery address"}
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder={lang === "uz" ? "To'liq manzilni kiriting..." : "Enter full address..."}
              className="w-full rounded-2xl border border-[#EEEEEE] px-4 py-3 text-[15px] min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            {geocoding && <p className="text-[12px] text-[#AAAAAA]">📍 Manzil aniqlanmoqda...</p>}
            {/* Mini delivery map */}
            {deliveryCoords && (
              <div className="rounded-2xl overflow-hidden h-40 border border-[#EEEEEE]">
                <DeliveryMap lat={deliveryCoords.lat} lng={deliveryCoords.lng} />
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-[13px] font-bold text-[#888] uppercase tracking-wide mb-1.5">
            {lang === "uz" ? "Izoh (ixtiyoriy)" : "Note (optional)"}
          </label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={lang === "uz" ? "masalan: Oshga yog' kamroq..." : "e.g. Less oil in osh..."}
            className="w-full h-12 rounded-2xl border border-[#EEEEEE] px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Bank transfer info */}
      <div className="bg-white rounded-2xl p-4 space-y-4">
        <h2 className="font-bold text-[16px]">💳 {lang === "uz" ? "To'lov" : "Payment"}</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[13px] text-amber-800 space-y-1">
          <p className="font-bold">{lang === "uz" ? "Ko'rsatma:" : "Instructions:"}</p>
          <p>1. {lang === "uz" ? "Bank ilovasini oching va quyidagi hisob raqamiga o'tkazma qiling." : "Open your banking app and transfer to the account below."}</p>
          <p>2. {lang === "uz" ? "Skrinshot oling yoki pastda tasdiqlang." : "Upload a screenshot or confirm below."}</p>
        </div>

        {/* Bank info */}
        <div className="space-y-2">
          <div className="p-3 bg-[#FAFAFA] rounded-2xl">
            <p className="text-[12px] text-[#AAAAAA]">{lang === "uz" ? "Bank" : "Bank"}</p>
            <p className="font-bold text-[16px]">{restaurant.bank_name}</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-2xl">
            <div>
              <p className="text-[12px] text-[#AAAAAA]">{lang === "uz" ? "Hisob raqami" : "Account number"}</p>
              <p className="font-extrabold font-mono text-[17px]">{restaurant.bank_account_number}</p>
              <p className="text-[12px] text-[#AAAAAA]">{restaurant.bank_account_holder}</p>
            </div>
            <button onClick={() => copy(restaurant.bank_account_number ?? "", "account")}
              className="h-10 px-4 bg-primary/10 text-primary rounded-xl text-[13px] font-bold">
              {copied === "account" ? "✓" : lang === "uz" ? "Nusxa" : "Copy"}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-2xl border border-primary/20">
            <div>
              <p className="text-[12px] text-[#AAAAAA]">{lang === "uz" ? "To'lov miqdori" : "Amount"}</p>
              <p className="font-extrabold text-[26px] text-primary">₩{total().toLocaleString()}</p>
            </div>
            <button onClick={() => copy(total().toString(), "amount")}
              className="h-10 px-4 bg-primary/10 text-primary rounded-xl text-[13px] font-bold">
              {copied === "amount" ? "✓" : lang === "uz" ? "Nusxa" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt upload */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h2 className="font-bold text-[16px]">📸 {lang === "uz" ? "Chek yuklash (ixtiyoriy)" : "Upload receipt (optional)"}</h2>
        <label className="block cursor-pointer">
          <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
            receiptUrl ? "border-green-400 bg-green-50" : "border-[#EEEEEE] hover:border-primary"
          }`}>
            {uploadingReceipt ? (
              <p className="text-[#AAAAAA] text-[14px]">Yuklanmoqda...</p>
            ) : receiptUrl ? (
              <p className="text-green-600 font-bold text-[15px]">✅ {lang === "uz" ? "Chek yuklandi" : "Receipt uploaded"}</p>
            ) : (
              <div>
                <span className="text-3xl">📷</span>
                <p className="text-[13px] text-[#AAAAAA] mt-1">
                  {lang === "uz" ? "To'lov cheki skrinshoti yuklang" : "Upload payment screenshot"}
                </p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setReceiptFile(file);
              const path = await uploadReceipt(file);
              setReceiptUrl(path);
            }} />
        </label>

        {/* OR confirm checkbox */}
        {!receiptUrl && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={paymentConfirmed}
              onChange={(e) => setPaymentConfirmed(e.target.checked)}
              className="w-5 h-5 rounded mt-0.5 accent-primary flex-shrink-0" />
            <span className="text-[14px] text-[#555] leading-relaxed">
              {lang === "uz"
                ? "Pul o'tkazmani amalga oshirdim va buyurtmamni tasdiqlayapman"
                : "I have made the bank transfer and confirm my order"}
            </span>
          </label>
        )}
      </div>

      {/* Submit button */}
      <button onClick={handleSubmit} disabled={!canSubmit}
        className={`w-full h-16 rounded-2xl font-extrabold text-[17px] transition-all ${
          canSubmit
            ? "bg-primary text-white active:scale-[0.98]"
            : "bg-[#EEEEEE] text-[#AAAAAA] cursor-not-allowed"
        }`}
        style={canSubmit ? { boxShadow: "0 4px 16px rgba(5,150,105,0.3)" } : {}}>
        {submitting ? "Yuborilmoqda..." : belowMinimum
          ? `⚠️ Min. ₩${DELIVERY_MINIMUM_KRW.toLocaleString()} kerak`
          : `✅ ${lang === "uz" ? "Yubordim / Buyurtmani tasdiqlash" : "I have sent / Confirm order"}`}
      </button>
    </div>
  );
}
