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
    <div
      className={`bg-white rounded-2xl overflow-hidden flex gap-3 p-3 ${
        unavailable ? "opacity-60" : ""
      }`}
    >
      {item.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photo_url}
          alt={item.name_uz}
          className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
        />
      ) : (
        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">🍽️</span>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-semibold text-base leading-tight">{item.name_uz}</p>
          {item.name_en && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.name_en}</p>
          )}
          {item.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-lg text-primary">
            ₩{item.price_krw.toLocaleString()}
          </span>

          {unavailable ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-medium">
              {item.sold_out_today ? "Bugun tugagan" : "Mavjud emas"}
            </span>
          ) : (
            <button
              onClick={() => onAdd(item)}
              className="w-10 h-10 bg-primary text-white rounded-xl text-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
