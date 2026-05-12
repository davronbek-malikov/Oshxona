import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["offline", "online", "busy"]),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Noto'g'ri ma'lumot" }, { status: 400 });

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();
  const { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();
  if (!dbUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });

  const update: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.lat != null) update.current_lat = parsed.data.lat;
  if (parsed.data.lng != null) update.current_lng = parsed.data.lng;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("delivery_riders")
    .update(update).eq("user_id", dbUser.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
