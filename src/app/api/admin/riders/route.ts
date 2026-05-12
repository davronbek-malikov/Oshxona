import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  // Any authenticated internal user can manage riders (restaurant owner / app admin)
  const admin = createAdminClient();

  const filter = req.nextUrl.searchParams.get("filter") ?? "pending";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("delivery_riders")
    .select("id, name, phone, vehicle, payment_method, bank_name, bank_account_number, bank_account_holder, is_approved, is_blocked, block_reason, penalty_krw, orders_completed, total_earnings_krw, status, created_at")
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("is_approved", false);
  } else if (filter === "approved") {
    query = query.eq("is_approved", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ riders: data ?? [] });
}
