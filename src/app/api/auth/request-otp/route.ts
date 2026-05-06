import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  getDeliveryMethod,
  buildTelegramDeepLink,
  sendSms,
} from "@/lib/otp-delivery";

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
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const { phone } = parsed.data;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const supabase = await createAdminClient();

  await supabase
    .from("phone_otps")
    .update({ used: true })
    .eq("phone", phone)
    .eq("used", false);

  const { error } = await supabase.from("phone_otps").insert({
    phone,
    code,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("OTP insert error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const method = getDeliveryMethod();

  if (method === "sms") {
    try {
      await sendSms(phone, code);
      await supabase
        .from("phone_otps")
        .update({ delivered: true })
        .eq("phone", phone)
        .eq("code", code);
    } catch (err) {
      console.error("SMS send error:", err);
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }
    return NextResponse.json({ method: "sms" });
  }

  // Default: Telegram
  const deepLink = buildTelegramDeepLink(phone);

  // In local dev: return the code directly so you can test without a webhook
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ method: "telegram", deepLink, devCode: code });
  }

  return NextResponse.json({ method: "telegram", deepLink });
}
