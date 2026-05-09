import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  name_uz: z.string().min(2),
  name_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  opening_time: z.string(),
  closing_time: z.string(),
  phone: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  bank_name: z.string(),
  bank_account_number: z.string(),
  bank_account_holder: z.string(),
  halal_cert_url: z.string().optional().nullable(),
  photos: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Derive owner from authenticated session — never trust client-supplied owner_id
  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = await createAdminClient();

  const { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();
  if (!dbUser) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });
  }

  const { lat, lng, ...rest } = parsed.data;

  // Check if restaurant already exists for this owner
  const { data: existing } = await admin
    .from("restaurants")
    .select("id")
    .eq("owner_id", dbUser.id)
    .single();

  if (existing) {
    const { error } = await admin
      .from("restaurants")
      .update({ ...rest, location: `POINT(${lng} ${lat})` })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: existing.id, updated: true });
  }

  // Create new restaurant (is_approved = false — requires admin approval)
  const { data, error } = await admin
    .from("restaurants")
    .insert({
      ...rest,
      owner_id: dbUser.id,
      location: `POINT(${lng} ${lat})`,
      is_approved: false,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Promote user role to restaurant
  await admin.from("users").update({ role: "restaurant" }).eq("id", dbUser.id);

  return NextResponse.json({ id: data.id, created: true });
}
