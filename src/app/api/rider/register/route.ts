import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  vehicle: z.enum(["motorcycle", "bicycle", "car", "walking"]).default("motorcycle"),
  payment_method: z.enum(["bank", "cash"]).default("bank"),
  bank_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_account_holder: z.string().optional().nullable(),
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
    return NextResponse.json({ error: "Ma'lumotlar noto'g'ri" }, { status: 400 });
  }

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();

  // First try to find the existing user by phone
  let { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();

  // If not found, create a new user record
  if (!dbUser) {
    const { data: newUser, error: insertErr } = await admin
      .from("users")
      .insert({ phone, role: "customer", language: "uz" })
      .select("id")
      .single();
    if (insertErr || !newUser) {
      return NextResponse.json({ error: insertErr?.message ?? "Foydalanuvchi yaratib bo'lmadi" }, { status: 500 });
    }
    dbUser = newUser;
  }

  // Check if already registered
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any).from("delivery_riders")
    .select("id").eq("user_id", dbUser.id).single();

  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).from("delivery_riders").insert({
    user_id: dbUser.id,
    phone,
    ...parsed.data,
    is_approved: false,
    status: "offline",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, created: true });
}
