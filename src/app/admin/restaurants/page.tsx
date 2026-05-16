"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/types/database";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];

export default function AdminRestaurantsPage() {
  const [pending,  setPending]  = useState<Restaurant[]>([]);
  const [approved, setApproved] = useState<Restaurant[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/restaurants");
    const all: Restaurant[] = res.ok ? await res.json() : [];
    setPending(all.filter((r) => !r.is_approved));
    setApproved(all.filter((r) =>  r.is_approved));
    setLoading(false);
  }

  async function act(id: string, action: "approve" | "reject") {
    setActing(id);
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await load();
    } else {
      const d = await res.json();
      alert(d.error ?? "Error");
    }
    setActing(null);
  }

  if (loading) {
    return <p className="text-muted-foreground text-center py-16">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      <section>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          ⏳ Pending approval
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-muted-foreground text-sm">
            No pending restaurants
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                acting={acting === r.id}
                onApprove={() => act(r.id, "approve")}
                onReject={() => act(r.id, "reject")}
              />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="font-bold text-lg mb-3 text-muted-foreground">
          ✅ Approved ({approved.length})
        </h2>
        <div className="space-y-3">
          {approved.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              acting={acting === r.id}
              onReject={() => act(r.id, "reject")}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function RestaurantCard({
  restaurant: r,
  acting,
  onApprove,
  onReject,
}: {
  restaurant: Restaurant;
  acting: boolean;
  onApprove?: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-base">{r.name_uz}</p>
          {r.name_en && <p className="text-muted-foreground text-sm">{r.name_en}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">{r.address}</p>
        </div>
        <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
          r.is_approved
            ? r.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {r.is_approved ? (r.is_active ? "Active" : "Inactive") : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <p><span className="text-muted-foreground">Phone: </span>{r.phone}</p>
        <p><span className="text-muted-foreground">Hours: </span>{r.opening_time} – {r.closing_time}</p>
        <p><span className="text-muted-foreground">Bank: </span>{r.bank_name}</p>
        <p className="font-mono text-xs">{r.bank_account_number}</p>
      </div>

      {r.halal_cert_url && (
        <a
          href={r.halal_cert_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm underline"
        >
          📄 View halal certificate
        </a>
      )}

      <div className="flex gap-2 pt-1">
        {!r.is_approved && onApprove && (
          <button
            onClick={onApprove}
            disabled={acting}
            className="flex-1 h-10 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            ✓ Approve
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`${r.is_approved ? "Disable" : "Reject"} "${r.name_uz}"?`)) onReject();
          }}
          disabled={acting}
          className="flex-1 h-10 border border-destructive text-destructive rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {r.is_approved ? "Disable" : "Reject"}
        </button>
      </div>
    </div>
  );
}
