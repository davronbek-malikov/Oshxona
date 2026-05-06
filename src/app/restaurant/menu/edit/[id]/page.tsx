"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { MenuCategory } from "@/types/database";

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: "tovuq",     label: "🍗 Tovuq" },
  { value: "kabob",     label: "🥩 Kabob" },
  { value: "somsa",     label: "🥟 Somsa" },
  { value: "osh",       label: "🍚 Osh" },
  { value: "salat",     label: "🥗 Salat" },
  { value: "ichimlik",  label: "🥤 Ichimlik" },
  { value: "shirinlik", label: "🍰 Shirinlik" },
];

const schema = z.object({
  name_uz:     z.string().min(2, "Kamida 2 ta harf"),
  name_en:     z.string().optional(),
  description: z.string().optional(),
  category: z.enum([
    "tovuq", "kabob", "somsa", "osh", "salat", "ichimlik", "shirinlik",
  ] as const),
  price_krw: z.coerce.number().min(100, "Narx kamida 100 ₩"),
});

type FormData = z.infer<typeof schema>;

export default function EditMenuItemPage() {
  const router   = useRouter();
  const { id }   = useParams<{ id: string }>();
  const { user } = useCurrentUser();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  // Load existing item and pre-fill form
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .single();

      if (!data) { router.replace("/restaurant/menu"); return; }

      reset({
        name_uz:     data.name_uz,
        name_en:     data.name_en  ?? "",
        description: data.description ?? "",
        category:    data.category ?? "kabob",
        price_krw:   data.price_krw,
      });
      setPhotoUrl(data.photo_url ?? null);
      setLoading(false);
    }
    load();
  }, [id, reset, router]);

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient();
    const path = `${user?.id ?? "anon"}/${Date.now()}.${file.name.split(".").pop()}`;
    const { data } = await supabase.storage
      .from("menu")
      .upload(path, file, { upsert: true });
    if (!data) return null;
    const { data: { publicUrl } } = supabase.storage.from("menu").getPublicUrl(data.path);
    return publicUrl;
  }

  async function onSubmit(values: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurant/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, photo_url: photoUrl }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground">
          ←
        </button>
        <h1 className="text-xl font-bold">Taomni tahrirlash</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Photo */}
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-colors">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
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
              if (file) setPhotoUrl(await uploadPhoto(file));
            }}
          />
        </label>

        <div>
          <label className="block text-sm font-semibold mb-1">Taom nomi (O'zbekcha) *</label>
          <Input {...register("name_uz")} placeholder="masalan: Samarqand oshi" className="h-12 text-base" />
          {errors.name_uz && <p className="text-destructive text-sm mt-1">{errors.name_uz.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Dish name (English)</label>
          <Input {...register("name_en")} placeholder="e.g. Samarkand Plov" className="h-12 text-base" />
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
          <label className="block text-sm font-semibold mb-1">Kategoriya *</label>
          <select
            {...register("category")}
            className="w-full h-12 rounded-xl border border-input px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Narxi (₩) *</label>
          <Input
            {...register("price_krw")}
            type="number"
            placeholder="masalan: 12000"
            className="h-12 text-base font-mono"
          />
          {errors.price_krw && <p className="text-destructive text-sm mt-1">{errors.price_krw.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash ✓"}
        </Button>
      </form>
    </div>
  );
}
