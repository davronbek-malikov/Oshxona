import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function POST(req: NextRequest) {
  // Verify the request is genuinely from Telegram
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== secret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  const body: TelegramUpdate = await req.json();
  const msg = body.message;

  if (!msg?.text) return NextResponse.json({ ok: true });

  const text = msg.text.trim();
  const chatId = msg.chat.id;

  // Handle /start <phone> deep-link
  if (text.startsWith("/start")) {
    const phone = text.replace("/start", "").trim();

    if (!phone) {
      await sendTelegramMessage(
        chatId,
        "Salom! Oshxona ilovasiga kiring va telefoningizni kiriting."
      );
      return NextResponse.json({ ok: true });
    }

    const supabase = await createAdminClient();

    const { data: otp } = await supabase
      .from("phone_otps")
      .select("id, code")
      .eq("phone", phone)
      .eq("used", false)
      .eq("delivered", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otp) {
      await sendTelegramMessage(
        chatId,
        "Kod topilmadi yoki muddati o'tgan. Iltimos, ilovadan qayta so'rang."
      );
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from("phone_otps")
      .update({ delivered: true })
      .eq("id", otp.id);

    await sendTelegramMessage(
      chatId,
      `🔐 <b>Oshxona tasdiqlash kodi:</b>\n\n<code>${otp.code}</code>\n\nBu kod 5 daqiqa amal qiladi.\n\nYour Oshxona verification code: <code>${otp.code}</code>`
    );

    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage(chatId, "Salom! Oshxona ilovasidan foydalaning.");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook is active" });
}
