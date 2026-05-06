import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });

  const { endpoint } = await req.json() as { endpoint?: string };
  const admin = await createAdminClient();
  const phone = "+" + user.email!.replace("@oshxona.internal", "");

  const { data: dbUser } = await admin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;
  if (endpoint) {
    await adminAny.from("push_subscriptions").delete().eq("user_id", dbUser.id).eq("endpoint", endpoint);
  } else {
    await adminAny.from("push_subscriptions").delete().eq("user_id", dbUser.id);
  }

  return NextResponse.json({ success: true });
}
