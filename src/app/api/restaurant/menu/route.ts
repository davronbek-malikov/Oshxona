import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  restaurant_id: z.string().uuid(),
  name_uz: z.string().min(2),
  name_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.enum([
    "tovuq",
    "kabob",
    "somsa",
    "osh",
    "salat",
    "ichimlik",
    "shirinlik",
  ]),
  price_krw: z.number().min(100),
  photo_url: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
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

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("menu_items")
    .insert({
      ...parsed.data,
      is_available: true,
      sold_out_today: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
