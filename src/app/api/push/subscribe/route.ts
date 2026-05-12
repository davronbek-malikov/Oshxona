import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });

  if (!user.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Noto'g'ri sessiya" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Noto'g'ri obuna ma'lumotlari" }, { status: 400 });
  }

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();

  const { data: dbUser } = await admin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("push_subscriptions").upsert(
    { user_id: dbUser.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: "user_id,endpoint" }
  );

  return NextResponse.json({ success: true });
}
