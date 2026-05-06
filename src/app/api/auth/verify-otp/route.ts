import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6),
});

// In-memory brute-force guard: {phone -> {attempts, lockedUntil}}
// Resets on server restart; good enough for MVP (use Redis for multi-region production)
const failMap = new Map<string, { attempts: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ma'lumotlar noto'g'ri" }, { status: 400 });
  }

  const { phone, code } = parsed.data;

  // Check lockout
  const entry = failMap.get(phone);
  if (entry) {
    if (Date.now() < entry.lockedUntil) {
      const minutesLeft = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Juda ko'p urinish. ${minutesLeft} daqiqadan so'ng urinib ko'ring.` },
        { status: 429 }
      );
    }
    // Lock expired — clear it
    if (entry.attempts >= MAX_ATTEMPTS) {
      failMap.delete(phone);
    }
  }

  const supabase = await createAdminClient();

  // Find valid OTP
  const { data: otp } = await supabase
    .from("phone_otps")
    .select("id, code, expires_at, used")
    .eq("phone", phone)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otp) {
    // Count this as a failed attempt
    const cur = failMap.get(phone) ?? { attempts: 0, lockedUntil: 0 };
    cur.attempts += 1;
    if (cur.attempts >= MAX_ATTEMPTS) {
      cur.lockedUntil = Date.now() + LOCK_MS;
    }
    failMap.set(phone, cur);
    return NextResponse.json({ error: "Kod noto'g'ri yoki topilmadi" }, { status: 400 });
  }

  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "Kod muddati tugagan. Qayta so'rang." }, { status: 400 });
  }

  // Constant-time code comparison to avoid timing attacks
  const expectedCode = otp.code.padEnd(6, " ");
  const providedCode = code.padEnd(6, " ");
  let mismatch = 0;
  for (let i = 0; i < 6; i++) {
    mismatch |= expectedCode.charCodeAt(i) ^ providedCode.charCodeAt(i);
  }

  if (mismatch !== 0) {
    const cur = failMap.get(phone) ?? { attempts: 0, lockedUntil: 0 };
    cur.attempts += 1;
    if (cur.attempts >= MAX_ATTEMPTS) {
      cur.lockedUntil = Date.now() + LOCK_MS;
    }
    failMap.set(phone, cur);
    return NextResponse.json({ error: "Kod noto'g'ri yoki topilmadi" }, { status: 400 });
  }

  // Code correct — clear lockout, mark used
  failMap.delete(phone);
  await supabase.from("phone_otps").update({ used: true }).eq("id", otp.id);

  // Upsert user
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ phone, role: "customer", language: "uz" }, { onConflict: "phone" })
    .select()
    .single();

  if (userError || !user) {
    console.error("User upsert error:", userError);
    return NextResponse.json({ error: "Foydalanuvchi yaratib bo'lmadi" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data: sessionData, error: signInError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${phone.replace("+", "").replace(/\s/g, "")}@oshxona.internal`,
      options: { redirectTo: `${appUrl}/auth/callback` },
    });

  if (signInError || !sessionData?.properties?.hashed_token) {
    console.error("Session error:", signInError);
    return NextResponse.json({ error: "Sessiya yaratib bo'lmadi" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      language: user.language,
    },
    tokenHash: sessionData.properties.hashed_token,
  });
}
