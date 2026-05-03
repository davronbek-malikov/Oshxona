import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ma'lumotlar noto'g'ri" }, { status: 400 });
  }

  const { phone, code } = parsed.data;
  const supabase = await createAdminClient();

  // Find valid OTP
  const { data: otp } = await supabase
    .from("phone_otps")
    .select("id, code, expires_at, used")
    .eq("phone", phone)
    .eq("code", code)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otp) {
    return NextResponse.json({ error: "Kod noto'g'ri yoki topilmadi" }, { status: 400 });
  }

  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "Kod muddati tugagan. Qayta so'rang." }, { status: 400 });
  }

  // Mark OTP used
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

  // Create a Supabase auth session using admin API
  // We use phone as the identifier. Since Supabase auth requires email or phone OTP natively,
  // we generate a magic link / sign the user in via the admin API with a custom token.
  // For simplicity, we store user identity in a signed cookie via Supabase Auth admin.
  const { data: sessionData, error: signInError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${phone.replace("+", "").replace(/\s/g, "")}@oshxona.internal`,
    });

  if (signInError) {
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
    // Client will use this link to establish the Supabase session
    sessionLink: sessionData?.properties?.action_link,
  });
}
