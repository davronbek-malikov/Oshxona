"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Filter = "pending" | "approved" | "all";

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  payment_method: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  is_approved: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  penalty_krw: number;
  orders_completed: number;
  total_earnings_krw: number;
  status: string;
  created_at: string;
}

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: "🏍️", bicycle: "🚲", car: "🚗", walking: "🚶",
};
const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Mototsikel", bicycle: "Velosiped", car: "Mashina", walking: "Piyoda",
};

export default function AdminRidersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [penaltyModal, setPenaltyModal] = useState<{ riderId: string; name: string } | null>(null);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [blockModal, setBlockModal] = useState<{ riderId: string; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const load = useCallback(async (f: Filter) => {
    setLoading(true);
    const res = await fetch(`/api/admin/riders?filter=${f}`);
    const data = await res.json();
    if (!res.ok) { showToast(data.error ?? "Xatolik", false); setLoading(false); return; }
    setRiders(data.riders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function doAction(riderId: string, body: Record<string, unknown>, successMsg: string) {
    setActing(riderId);
    try {
      const res = await fetch(`/api/admin/riders/${riderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Xatolik", false); return; }
      showToast(successMsg, true);
      load(filter);
    } catch { showToast("Internet aloqasini tekshiring", false); }
    finally { setActing(null); }
  }

  async function submitPenalty() {
    if (!penaltyModal) return;
    const amount = parseInt(penaltyAmount);
    if (!amount || amount <= 0) return;
    await doAction(penaltyModal.riderId, { action: "penalty", amount, reason: penaltyReason }, `₩${amount.toLocaleString()} jarima qo'shildi`);
    setPenaltyModal(null); setPenaltyAmount(""); setPenaltyReason("");
  }

  async function submitBlock() {
    if (!blockModal) return;
    if (!blockReason.trim()) return;
    await doAction(blockModal.riderId, { action: "block", reason: blockReason }, "Kuryer bloklandi");
    setBlockModal(null); setBlockReason("");
  }

  const pendingCount = filter === "pending" ? riders.length : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/restaurant/dashboard")}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Orqaga">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-[18px] font-extrabold leading-none text-gray-900">Kuryerlar</h1>
              <p className="text-[12px] text-gray-400 mt-0.5">Boshqaruv paneli</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="bg-[#F97316] text-white text-[12px] font-bold px-2.5 py-1 rounded-full">
              {pendingCount} yangi
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-3">
        <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["pending", "approved", "all"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}>
              {f === "pending" ? "Kutayotgan" : f === "approved" ? "Tasdiqlangan" : "Barchasi"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 pb-12 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
          </div>
        )}

        {!loading && riders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <p className="text-gray-400 text-[15px] font-medium">
              {filter === "pending" ? "Kutayotgan so'rovlar yo'q" : "Kuryer topilmadi"}
            </p>
          </div>
        )}

        {!loading && riders.map((rider) => (
          <div key={rider.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className={`h-1 ${rider.is_blocked ? "bg-red-500" : rider.is_approved ? "bg-green-500" : "bg-[#F97316]"}`} />

            <div className="p-5 space-y-4">
              {/* Name + vehicle row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {VEHICLE_ICONS[rider.vehicle] ?? "🚗"}
                  </div>
                  <div>
                    <p className="font-extrabold text-[17px] text-gray-900 leading-tight">{rider.name}</p>
                    <p className="text-[13px] text-gray-400 mt-0.5">{rider.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[12px] bg-gray-100 text-gray-500 px-3 py-1 rounded-lg font-medium">
                    {VEHICLE_LABELS[rider.vehicle] ?? rider.vehicle}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {rider.payment_method === "cash" ? "💵 Naqd" : "🏦 Bank"}
                  </span>
                </div>
              </div>

              {/* Stats row (for approved riders) */}
              {rider.is_approved && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-[11px] text-gray-400 uppercase">Buyurtma</p>
                    <p className="font-bold text-gray-900">{rider.orders_completed}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-[11px] text-gray-400 uppercase">Daromad</p>
                    <p className="font-bold text-[#F97316]">₩{(rider.total_earnings_krw ?? 0).toLocaleString()}</p>
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-center ${rider.penalty_krw > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                    <p className="text-[11px] text-gray-400 uppercase">Jarima</p>
                    <p className={`font-bold ${rider.penalty_krw > 0 ? "text-red-500" : "text-gray-400"}`}>
                      {rider.penalty_krw > 0 ? `-₩${rider.penalty_krw.toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Block reason */}
              {rider.is_blocked && rider.block_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <p className="text-[12px] text-red-600 font-semibold">🚫 {rider.block_reason}</p>
                </div>
              )}

              {/* Bank info */}
              {rider.payment_method === "bank" && rider.bank_name && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Bank</p>
                  <p className="text-[14px] text-gray-900 font-semibold">{rider.bank_name}</p>
                  {rider.bank_account_number && (
                    <p className="text-[12px] text-gray-500 font-mono">{rider.bank_account_number}</p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-gray-300">
                {new Date(rider.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>

              {/* Actions */}
              <div className="space-y-2">
                {/* Approve/Reject for pending */}
                {!rider.is_approved && !rider.is_blocked && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction(rider.id, { action: "approve" }, "Kuryer tasdiqlandi ✓")}
                      disabled={acting === rider.id}
                      className="flex-1 h-11 rounded-xl bg-[#F97316] text-white font-bold text-[14px] disabled:opacity-50 active:scale-[0.98]">
                      {acting === rider.id ? "..." : "✓ Tasdiqlash"}
                    </button>
                    <button onClick={() => doAction(rider.id, { action: "reject" }, "Rad etildi")}
                      disabled={acting === rider.id}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-500 font-bold text-[14px] disabled:opacity-50 hover:border-red-200 hover:text-red-500 transition-colors">
                      Rad etish
                    </button>
                  </div>
                )}

                {/* Approved rider actions */}
                {rider.is_approved && (
                  <div className="flex gap-2">
                    {!rider.is_blocked ? (
                      <>
                        <button onClick={() => { setBlockModal({ riderId: rider.id, name: rider.name }); setBlockReason(""); }}
                          className="flex-1 h-10 rounded-xl border border-red-200 text-red-500 font-bold text-[13px] hover:bg-red-50 transition-colors">
                          🚫 Bloklash
                        </button>
                        <button onClick={() => { setPenaltyModal({ riderId: rider.id, name: rider.name }); setPenaltyAmount(""); setPenaltyReason(""); }}
                          className="flex-1 h-10 rounded-xl border border-orange-200 text-orange-600 font-bold text-[13px] hover:bg-orange-50 transition-colors">
                          ⚠️ Jarima
                        </button>
                      </>
                    ) : (
                      <button onClick={() => doAction(rider.id, { action: "unblock" }, "Blok olib tashlandi")}
                        disabled={acting === rider.id}
                        className="w-full h-10 rounded-xl bg-green-500 text-white font-bold text-[13px] disabled:opacity-50">
                        {acting === rider.id ? "..." : "✓ Blokni olib tashlash"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Block modal */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-extrabold text-[17px] text-gray-900">🚫 {blockModal.name} — Bloklash</h2>
            <div>
              <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Bloklash sababi *
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Masalan: Buyurtmani o'z vaqtida yetkazib bermadi"
                rows={3}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#F97316] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBlockModal(null)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-500 font-bold">
                Bekor
              </button>
              <button onClick={submitBlock} disabled={!blockReason.trim() || acting !== null}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">
                Bloklash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Penalty modal */}
      {penaltyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-extrabold text-[17px] text-gray-900">⚠️ {penaltyModal.name} — Jarima</h2>
            <div>
              <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Jarima miqdori (₩) *
              </label>
              <input type="number" inputMode="numeric" value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                placeholder="Masalan: 5000"
                className="w-full h-14 rounded-xl bg-gray-50 border border-gray-200 px-4 text-[16px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#F97316]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Sabab (ixtiyoriy)
              </label>
              <input type="text" value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                placeholder="Masalan: Kech yetkazib berdi"
                className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#F97316]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPenaltyModal(null)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-500 font-bold">
                Bekor
              </button>
              <button onClick={submitPenalty} disabled={!penaltyAmount || parseInt(penaltyAmount) <= 0 || acting !== null}
                className="flex-1 h-12 rounded-xl bg-[#F97316] text-white font-bold disabled:opacity-50">
                Jarima qo&apos;shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-[14px] font-semibold shadow-xl ${
          toast.ok ? "bg-green-600" : "bg-red-700"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
