import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  owner_id: z.string().uuid(),
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
  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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

  const { lat, lng, ...rest } = parsed.data;

  const admin = await createAdminClient();

  // Check if restaurant already exists for this owner
  const { data: existing } = await admin
    .from("restaurants")
    .select("id")
    .eq("owner_id", rest.owner_id)
    .single();

  if (existing) {
    // Update existing
    const { error } = await admin
      .from("restaurants")
      .update({
        ...rest,
        location: `POINT(${lng} ${lat})`,
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: existing.id, updated: true });
  }

  // Create new
  const { data, error } = await admin
    .from("restaurants")
    .insert({
      ...rest,
      location: `POINT(${lng} ${lat})`,
      is_approved: false,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update user role to restaurant
  await admin
    .from("users")
    .update({ role: "restaurant" })
    .eq("id", rest.owner_id);

  return NextResponse.json({ id: data.id, created: true });
}
