"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormState {
  name_uz: string;
  name_en: string;
  description: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
}

const EMPTY: FormState = {
  name_uz: "", name_en: "", description: "", phone: "",
  opening_time: "", closing_time: "",
  bank_name: "", bank_account_number: "", bank_account_holder: "",
};

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user!.id)
        .single();

      if (!data) { router.replace("/restaurant/onboarding"); return; }

      setRestaurantId(data.id);
      setLat((data.location as unknown as { lat: number })?.lat ?? 0);
      setLng((data.location as unknown as { lng: number })?.lng ?? 0);
      setForm({
        name_uz:              data.name_uz ?? "",
        name_en:              data.name_en ?? "",
        description:          data.description ?? "",
        phone:                data.phone ?? "",
        opening_time:         data.opening_time ?? "",
        closing_time:         data.closing_time ?? "",
        bank_name:            data.bank_name ?? "",
        bank_account_number:  data.bank_account_number ?? "",
        bank_account_holder:  data.bank_account_holder ?? "",
      });
      setLoading(false);
    }
    load();
  }, [user, router]);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSave() {
    if (!user || !restaurantId) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/restaurant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_id: user.id,
        address: "",   // preserved server-side; location is re-sent as-is
        lat,
        lng,
        photos: [],
        ...form,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      alert(data.error ?? "Error saving");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground text-xl">←</button>
        <h1 className="text-xl font-bold">Restaurant Settings</h1>
      </div>

      {/* Basic info */}
      <section className="bg-white rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase">Basic Info</h2>

        <div>
          <label className="block text-sm font-semibold mb-1">Name (Uzbek) *</label>
          <Input value={form.name_uz} onChange={set("name_uz")} className="h-12" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Name (English)</label>
          <Input value={form.name_en} onChange={set("name_en")} className="h-12" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={set("description")}
            className="w-full rounded-xl border border-input px-3 py-3 text-base min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Phone</label>
          <Input value={form.phone} onChange={set("phone")} type="tel" className="h-12" />
        </div>
      </section>

      {/* Hours */}
      <section className="bg-white rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase">Opening Hours</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Opens</label>
            <Input value={form.opening_time} onChange={set("opening_time")} type="time" className="h-12" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Closes</label>
            <Input value={form.closing_time} onChange={set("closing_time")} type="time" className="h-12" />
          </div>
        </div>
      </section>

      {/* Bank details */}
      <section className="bg-white rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase">Bank Details</h2>
        <div>
          <label className="block text-sm font-semibold mb-1">Bank name</label>
          <Input value={form.bank_name} onChange={set("bank_name")} placeholder="e.g. 신한은행" className="h-12" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Account number</label>
          <Input value={form.bank_account_number} onChange={set("bank_account_number")} className="h-12 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Account holder</label>
          <Input value={form.bank_account_holder} onChange={set("bank_account_holder")} className="h-12" />
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save changes"}
      </Button>
    </div>
  );
}
