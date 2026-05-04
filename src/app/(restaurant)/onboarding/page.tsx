"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker"),
  { ssr: false }
);

const KOREAN_BANKS = [
  "KB국민은행",
  "신한은행",
  "하나은행",
  "우리은행",
  "농협은행",
  "카카오뱅크",
  "토스뱅크",
  "기업은행",
  "SC제일은행",
];

// ─── Step schemas ─────────────────────────────────────────────────────────────

const infoSchema = z.object({
  name_uz: z.string().min(2, "Kamida 2 ta harf"),
  name_en: z.string().optional(),
  description: z.string().optional(),
  opening_time: z.string().min(1, "Majburiy"),
  closing_time: z.string().min(1, "Majburiy"),
  phone: z.string().min(7, "Telefon raqam kiriting"),
});
type InfoForm = z.infer<typeof infoSchema>;

const bankSchema = z.object({
  bank_name: z.string().min(1, "Bank tanlang"),
  bank_account_number: z.string().min(8, "Hisob raqam kiriting"),
  bank_account_holder: z.string().min(2, "Ism kiriting"),
});
type BankForm = z.infer<typeof bankSchema>;

// ─── Collected data ───────────────────────────────────────────────────────────

interface OnboardingData {
  name_uz: string;
  name_en?: string;
  description?: string;
  opening_time: string;
  closing_time: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  halal_cert_url?: string;
  photos: string[];
}

const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.978;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    lat: SEOUL_LAT,
    lng: SEOUL_LNG,
    address: "",
    photos: [],
  });

  // ─── Step 1: Basic info ──────────────────────────────────────────────────
  const infoForm = useForm<InfoForm>({ resolver: zodResolver(infoSchema) });

  function submitInfo(values: InfoForm) {
    setData((d) => ({ ...d, ...values }));
    setStep(2);
  }

  // ─── Step 2: Location ────────────────────────────────────────────────────
  async function geocodeAddress(address: string) {
    if (!address.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const results = await res.json();
      if (results[0]) {
        setData((d) => ({
          ...d,
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
          address,
        }));
      }
    } catch {
      // silently fail — user can still drag pin
    }
  }

  // ─── Step 3: Halal cert ──────────────────────────────────────────────────
  async function uploadHalalCert(file: File) {
    const supabase = createClient();
    const path = `certs/${user?.id ?? "unknown"}/${Date.now()}.${file.name.split(".").pop()}`;
    const { data: uploaded } = await supabase.storage
      .from("certificates")
      .upload(path, file, { upsert: true });
    if (uploaded) {
      setData((d) => ({ ...d, halal_cert_url: uploaded.path }));
    }
  }

  // ─── Step 4: Bank info ───────────────────────────────────────────────────
  const bankForm = useForm<BankForm>({ resolver: zodResolver(bankSchema) });

  function submitBank(values: BankForm) {
    setData((d) => ({ ...d, ...values }));
    setStep(5);
  }

  // ─── Step 5: Photos ──────────────────────────────────────────────────────
  async function uploadPhoto(file: File) {
    const supabase = createClient();
    const path = `${user?.id ?? "unknown"}/${Date.now()}.${file.name.split(".").pop()}`;
    const { data: uploaded } = await supabase.storage
      .from("restaurants")
      .upload(path, file, { upsert: true });
    if (uploaded) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("restaurants").getPublicUrl(uploaded.path);
      setData((d) => ({
        ...d,
        photos: [...(d.photos ?? []), publicUrl],
      }));
    }
  }

  // ─── Final submit ────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!user) return;
    setSaving(true);

    try {
      const res = await fetch("/api/restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          owner_id: user.id,
        }),
      });

      if (res.ok) {
        setStep(6);
      } else {
        alert("Xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ─── Progress bar ────────────────────────────────────────────────────────
  const TOTAL = 5;
  const progress = Math.round(((step - 1) / TOTAL) * 100);

  return (
    <div className="min-h-screen bg-white">
      {/* Header + progress */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">Restoran ro'yxatdan o'tish</h1>
            <span className="text-sm text-muted-foreground">
              {step < 6 ? `${step}/5` : "Tayyor!"}
            </span>
          </div>
          {step < 6 && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-6">
        {/* ── STEP 1: Restaurant info ───────────────────────────── */}
        {step === 1 && (
          <form onSubmit={infoForm.handleSubmit(submitInfo)} className="space-y-4">
            <h2 className="text-xl font-bold">📋 Asosiy ma'lumotlar</h2>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Restoran nomi (O'zbekcha) *
              </label>
              <Input
                {...infoForm.register("name_uz")}
                placeholder="masalan: O'zbek Oshxonasi"
                className="h-12 text-base"
              />
              {infoForm.formState.errors.name_uz && (
                <p className="text-destructive text-sm mt-1">
                  {infoForm.formState.errors.name_uz.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Restaurant name (English)
              </label>
              <Input
                {...infoForm.register("name_en")}
                placeholder="e.g. Uzbek Kitchen"
                className="h-12 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Tavsif / Description
              </label>
              <textarea
                {...infoForm.register("description")}
                placeholder="Restoran haqida qisqacha..."
                className="w-full rounded-xl border border-input px-3 py-3 text-base min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ochilish vaqti *
                </label>
                <Input
                  {...infoForm.register("opening_time")}
                  type="time"
                  className="h-12 text-base"
                />
                {infoForm.formState.errors.opening_time && (
                  <p className="text-destructive text-sm mt-1">
                    {infoForm.formState.errors.opening_time.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Yopilish vaqti *
                </label>
                <Input
                  {...infoForm.register("closing_time")}
                  type="time"
                  className="h-12 text-base"
                />
                {infoForm.formState.errors.closing_time && (
                  <p className="text-destructive text-sm mt-1">
                    {infoForm.formState.errors.closing_time.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Restoran telefon raqami *
              </label>
              <Input
                {...infoForm.register("phone")}
                type="tel"
                placeholder="+82 10 xxxx xxxx"
                className="h-12 text-base"
              />
              {infoForm.formState.errors.phone && (
                <p className="text-destructive text-sm mt-1">
                  {infoForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg">
              Davom etish →
            </Button>
          </form>
        )}

        {/* ── STEP 2: Location ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">📍 Manzil</h2>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Manzilni kiriting
              </label>
              <div className="flex gap-2">
                <Input
                  value={data.address}
                  onChange={(e) =>
                    setData((d) => ({ ...d, address: e.target.value }))
                  }
                  placeholder="masalan: Ansan, Gyeonggi-do"
                  className="flex-1 h-12 text-base"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => geocodeAddress(data.address ?? "")}
                  className="h-12 px-4"
                >
                  Topish
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Xaritada pin-ni sudrab yoki bosib aniq manzilni belgilang.
            </p>

            <LocationPicker
              lat={data.lat ?? SEOUL_LAT}
              lng={data.lng ?? SEOUL_LNG}
              onChange={(lat, lng) => setData((d) => ({ ...d, lat, lng }))}
            />

            <p className="text-xs text-muted-foreground text-center">
              {data.lat?.toFixed(5)}, {data.lng?.toFixed(5)}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                ← Orqaga
              </Button>
              <Button
                onClick={() => {
                  if (!data.address?.trim()) {
                    alert("Manzil kiriting");
                    return;
                  }
                  setStep(3);
                }}
                className="flex-1"
              >
                Davom etish →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Halal certificate ─────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">📜 Halol sertifikati</h2>
            <p className="text-muted-foreground text-sm">
              Halol sertifikatingizni yuklang. Bu sertifikat admin tomonidan
              tekshiriladi.
            </p>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors">
                {data.halal_cert_url ? (
                  <div>
                    <span className="text-4xl">✅</span>
                    <p className="font-semibold mt-2">Sertifikat yuklandi</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Boshqa fayl tanlash uchun bosing
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl">📄</span>
                    <p className="font-semibold mt-2">Sertifikatni yuklang</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, PDF — max 5 MB
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadHalalCert(file);
                }}
              />
            </label>

            <p className="text-xs text-muted-foreground text-center">
              Sertifikat bo'lmasa ham davom etishingiz mumkin — keyinroq
              yuborishingiz mumkin.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                ← Orqaga
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Davom etish →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Bank info ─────────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={bankForm.handleSubmit(submitBank)} className="space-y-4">
            <h2 className="text-xl font-bold">🏦 Bank ma'lumotlari</h2>
            <p className="text-muted-foreground text-sm">
              Mijozlar to'lovni shu hisob raqamiga amalga oshiradilar.
            </p>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Bank *
              </label>
              <select
                {...bankForm.register("bank_name")}
                className="w-full h-12 rounded-xl border border-input px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Bank tanlang...</option>
                {KOREAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {bankForm.formState.errors.bank_name && (
                <p className="text-destructive text-sm mt-1">
                  {bankForm.formState.errors.bank_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Hisob raqami *
              </label>
              <Input
                {...bankForm.register("bank_account_number")}
                placeholder="xxx-xxxx-xxxx-xx"
                className="h-12 text-base font-mono"
              />
              {bankForm.formState.errors.bank_account_number && (
                <p className="text-destructive text-sm mt-1">
                  {bankForm.formState.errors.bank_account_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Hisob egasining ismi *
              </label>
              <Input
                {...bankForm.register("bank_account_holder")}
                placeholder="Kim Chulsoo / Aliyev Bobur"
                className="h-12 text-base"
              />
              {bankForm.formState.errors.bank_account_holder && (
                <p className="text-destructive text-sm mt-1">
                  {bankForm.formState.errors.bank_account_holder.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1"
              >
                ← Orqaga
              </Button>
              <Button type="submit" className="flex-1">
                Davom etish →
              </Button>
            </div>
          </form>
        )}

        {/* ── STEP 5: Photos ───────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">📸 Restoran rasmlari</h2>
            <p className="text-muted-foreground text-sm">
              Restoraningizning rasmlarini yuklang (max 5 ta). Bu ixtiyoriy.
            </p>

            {/* Photo thumbnails */}
            {(data.photos?.length ?? 0) > 0 && (
              <div className="flex gap-2 flex-wrap">
                {data.photos?.map((url, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <button
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          photos: d.photos?.filter((_, j) => j !== i),
                        }))
                      }
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(data.photos?.length ?? 0) < 5 && (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-colors">
                  <span className="text-3xl">📷</span>
                  <p className="font-semibold mt-2">Rasm qo'shish</p>
                  <p className="text-xs text-muted-foreground">
                    {(data.photos?.length ?? 0)}/5 rasm
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
              </label>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(4)}
                className="flex-1"
              >
                ← Orqaga
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Yuklanmoqda..." : "Yuborish ✓"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Success ──────────────────────────────────── */}
        {step === 6 && (
          <div className="text-center py-12 space-y-6">
            <span className="text-7xl">🎉</span>
            <div>
              <h2 className="text-2xl font-bold">Muvaffaqiyatli yuborildi!</h2>
              <p className="text-muted-foreground mt-3 text-base">
                Restoraningiz ma'lumotlari qabul qilindi. Admin tomonidan
                tekshirilgandan so'ng aktivlashtirilamiz.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Your application has been submitted. We will review and approve
                it shortly.
              </p>
            </div>
            <Button
              onClick={() => router.replace("/restaurant/dashboard")}
              size="lg"
              className="w-full"
            >
              Dasturga kirish →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
