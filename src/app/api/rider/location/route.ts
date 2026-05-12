import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const { lat, lng } = await req.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat/lng kerak" }, { status: 400 });
  }

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();

  const { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();
  if (!dbUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("delivery_riders")
    .update({ current_lat: lat, current_lng: lng })
    .eq("user_id", dbUser.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
