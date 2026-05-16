"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { MenuCategory } from "@/types/database";

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: "tovuq", label: "🍗 Tovuq" },
  { value: "kabob", label: "🥩 Kabob" },
  { value: "somsa", label: "🥟 Somsa" },
  { value: "osh", label: "🍚 Osh" },
  { value: "salat", label: "🥗 Salat" },
  { value: "ichimlik", label: "🥤 Ichimlik" },
  { value: "shirinlik", label: "🍰 Shirinlik" },
];

const schema = z.object({
  name_uz: z.string().min(2, "Kamida 2 ta harf"),
  name_en: z.string().optional(),
  description: z.string().optional(),
  category: z.enum([
    "tovuq",
    "kabob",
    "somsa",
    "osh",
    "salat",
    "ichimlik",
    "shirinlik",
  ] as const),
  price_krw: z.coerce.number().min(100, "Narx kamida 100 ₩"),
});

type FormData = z.infer<typeof schema>;

export default function AddMenuItemPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient();
    const path = `${user?.id ?? "anon"}/${Date.now()}.${file.name.split(".").pop()}`;
    const { data } = await supabase.storage
      .from("menu")
      .upload(path, file, { upsert: true });
    if (!data) return null;
    const {
      data: { publicUrl },
    } = supabase.storage.from("menu").getPublicUrl(data.path);
    return publicUrl;
  }

  async function onSubmit(values: FormData) {
    if (!user) return;
    setSaving(true);

    try {
      // Get restaurant id via API (bypasses RLS)
      const rRes = await fetch("/api/restaurant");
      const rJson = rRes.ok ? await rRes.json() : {};
      const r = rJson.restaurant;

      if (!r) {
        alert("Restoran topilmadi");
        return;
      }

      const res = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: r.id,
          ...values,
          photo_url: photoUrl,
        }),
      });

      if (res.ok) {
        router.replace("/restaurant/menu");
      } else {
        const data = await res.json();
        alert(data.error ?? "Xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Yangi taom qo'shish</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Photo */}
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-colors">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl"
              />
            ) : (
              <div>
                <span className="text-4xl">📸</span>
                <p className="font-semibold mt-2">Rasm qo'shish</p>
                <p className="text-xs text-muted-foreground">Ixtiyoriy</p>
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
                const url = await uploadPhoto(file);
                setPhotoUrl(url);
              }
            }}
          />
        </label>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Taom nomi (O'zbekcha) *
          </label>
          <Input
            {...register("name_uz")}
            placeholder="masalan: Samarqand oshi"
            className="h-12 text-base"
          />
          {errors.name_uz && (
            <p className="text-destructive text-sm mt-1">
              {errors.name_uz.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Dish name (English)
          </label>
          <Input
            {...register("name_en")}
            placeholder="e.g. Samarkand Plov"
            className="h-12 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Tavsif</label>
          <textarea
            {...register("description")}
            placeholder="Taom haqida qisqacha..."
            className="w-full rounded-xl border border-input px-3 py-3 text-base min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Kategoriya *
          </label>
          <select
            {...register("category")}
            className="w-full h-12 rounded-xl border border-input px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Kategoriya tanlang...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-destructive text-sm mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Narxi (₩) *
          </label>
          <Input
            {...register("price_krw")}
            type="number"
            placeholder="masalan: 12000"
            className="h-12 text-base font-mono"
          />
          {errors.price_krw && (
            <p className="text-destructive text-sm mt-1">
              {errors.price_krw.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash ✓"}
        </Button>
      </form>
    </div>
  );
}
