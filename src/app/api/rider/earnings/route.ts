import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();
  if (!dbUser) return NextResponse.json({ deliveries: [] });

  const { data: rider } = await adminAny.from("delivery_riders")
    .select("id").eq("user_id", dbUser.id).single();
  if (!rider) return NextResponse.json({ deliveries: [] });

  const { data: deliveries } = await adminAny
    .from("rider_deliveries")
    .select("id, fee_krw, distance_km, delivered_at, order_id")
    .eq("rider_id", rider.id)
    .order("delivered_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ deliveries: deliveries ?? [] });
}
