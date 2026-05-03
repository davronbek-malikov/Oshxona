import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8).max(20),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Telefon raqami noto'g'ri" }, { status: 400 });
  }

  const { phone } = parsed.data;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

  const supabase = await createAdminClient();

  // Invalidate any existing unused OTPs for this phone
  await supabase
    .from("phone_otps")
    .update({ used: true })
    .eq("phone", phone)
    .eq("used", false);

  // Insert new OTP
  const { error } = await supabase.from("phone_otps").insert({
    phone,
    code,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("OTP insert error:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "OshxonaBot";
  const deepLink = `https://t.me/${botUsername}?start=${encodeURIComponent(phone)}`;

  return NextResponse.json({ deepLink });
}
