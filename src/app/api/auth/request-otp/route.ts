import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { buildTelegramDeepLink, sendSms, getDeliveryMethod } from "@/lib/otp-delivery";

const schema = z.object({
  phone: z.string().min(8).max(20),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramDirect(chatId: number, code: string): Promise<boolean> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: "HTML",
        text: `🔐 <b>Oshxona tasdiqlash kodi:</b>\n\n<code>${code}</code>\n\nBu kod 5 daqiqa amal qiladi.\n\nYour verification code: <code>${code}</code>`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const { phone } = parsed.data;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const supabase = await createAdminClient();

  // Invalidate old OTPs
  await supabase.from("phone_otps").update({ used: true }).eq("phone", phone).eq("used", false);

  // Save new OTP
  const { error } = await supabase.from("phone_otps").insert({ phone, code, expires_at: expiresAt });
  if (error) {
    console.error("OTP insert error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // SMS mode
  if (getDeliveryMethod() === "sms") {
    try {
      await sendSms(phone, code);
      await supabase.from("phone_otps").update({ delivered: true }).eq("phone", phone).eq("code", code);
    } catch (err) {
      console.error("SMS send error:", err);
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }
    return NextResponse.json({ method: "sms" });
  }

  // Telegram mode — check if user already has telegram_user_id saved
  const { data: existingUser } = await supabase
    .from("users")
    .select("telegram_user_id")
    .eq("phone", phone)
    .single();

  if (existingUser?.telegram_user_id) {
    // ✅ User already started the bot before — send code DIRECTLY to their Telegram
    const sent = await sendTelegramDirect(Number(existingUser.telegram_user_id), code);

    if (sent) {
      await supabase.from("phone_otps").update({ delivered: true }).eq("phone", phone).eq("code", code);
      // In dev: also return code for testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ method: "telegram", autoSent: true, devCode: code });
      }
      return NextResponse.json({ method: "telegram", autoSent: true });
    }
    // If direct send failed (user blocked bot etc.) — fall through to deeplink
  }

  // First time user — needs to open bot once to link their Telegram account
  const deepLink = buildTelegramDeepLink(phone);

  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ method: "telegram", deepLink, devCode: code });
  }

  return NextResponse.json({ method: "telegram", deepLink });
}
