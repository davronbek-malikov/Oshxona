import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  name_uz: z.string().min(2).optional(),
  name_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z
    .enum(["tovuq", "kabob", "somsa", "osh", "salat", "ichimlik", "shirinlik"])
    .optional(),
  price_krw: z.number().min(100).optional(),
  photo_url: z.string().optional().nullable(),
  is_available: z.boolean().optional(),
  sold_out_today: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/restaurant/menu/[id]">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ma'lumotlar noto'g'ri" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("menu_items")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/restaurant/menu/[id]">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const admin = await createAdminClient();
  const { error } = await admin.from("menu_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
