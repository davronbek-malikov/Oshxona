"use client";

import type { Database } from "@/types/database";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAdd }: Props) {
  const unavailable = !item.is_available || item.sold_out_today;

  return (
    <div className={`flex items-center gap-4 px-4 py-4 ${unavailable ? "opacity-40" : ""}`}>
      {/* Photo */}
      {item.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photo_url}
          alt={item.name_uz}
          className="w-[88px] h-[88px] object-cover rounded-2xl flex-shrink-0"
        />
      ) : (
        <div className="w-[88px] h-[88px] bg-[#F5F5F5] rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">🍽️</span>
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[17px] text-[#111] leading-snug">
          {item.name_uz}
        </p>
        {item.description && (
          <p className="text-[13px] text-[#BBBBBB] mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="font-extrabold text-[18px] text-primary mt-2">
          ₩{item.price_krw.toLocaleString()}
        </p>
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {unavailable ? (
          <span className="text-[12px] text-[#BBBBBB] font-medium">
            {item.sold_out_today ? "Tugagan" : "Yoʻq"}
          </span>
        ) : (
          <button
            onClick={() => onAdd(item)}
            className="w-9 h-9 rounded-full border-2 border-primary text-primary text-xl font-bold flex items-center justify-center active:bg-primary active:text-white transition-colors"
            aria-label="Qo'shish"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
