import crypto from "crypto";

export type DeliveryMethod = "telegram" | "sms";

export function getDeliveryMethod(): DeliveryMethod {
  const val = process.env.OTP_DELIVERY ?? "telegram";
  return val === "sms" ? "sms" : "telegram";
}

// ─── Telegram ────────────────────────────────────────────────────────────────

export function buildTelegramDeepLink(phone: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "OshxonaBot";
  // Telegram start param only allows a-z A-Z 0-9 _ -
  // Strip the leading + so +821028222901 → 821028222901
  // Webhook adds it back when looking up the OTP
  const safePhone = phone.replace(/^\+/, "");
  return `https://t.me/${botUsername}?start=${safePhone}`;
}

// ─── SMS via Solapi ───────────────────────────────────────────────────────────
// Activate by setting OTP_DELIVERY=sms in .env.local
// Requires: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_NUMBER

function buildSolapiAuth(): string {
  const apiKey = process.env.SOLAPI_API_KEY!;
  const apiSecret = process.env.SOLAPI_API_SECRET!;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 ApiKey=${apiKey}, Date=${date}, Salt=${salt}, Signature=${signature}`;
}

export async function sendSms(phone: string, code: string): Promise<void> {
  const sender = process.env.SOLAPI_SENDER_NUMBER!;

  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildSolapiAuth(),
    },
    body: JSON.stringify({
      message: {
        to: phone,
        from: sender,
        text: `[Oshxona] Your verification code: ${code}. Valid for 5 minutes.`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Solapi error: ${err}`);
  }
}
