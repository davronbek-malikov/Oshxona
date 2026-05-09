import Link from "next/link";

interface Props {
  id: string;
  name_uz: string;
  description?: string | null;
  address?: string | null;
  distance_km?: number;
  photos?: string[];
  opening_time?: string | null;
  closing_time?: string | null;
}

function isOpen(opening: string | null | undefined, closing: string | null | undefined) {
  if (!opening || !closing) return null;
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return hhmm >= opening && hhmm <= closing;
}

export function RestaurantCard({
  id, name_uz, description, address, distance_km, photos, opening_time, closing_time,
}: Props) {
  const open = isOpen(opening_time, closing_time);
  const photo = photos?.[0];

  return (
    <Link href={`/menu/${id}`}>
      <div
        className="bg-white rounded-2xl flex gap-3 p-3 active:scale-[0.98] transition-transform"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        {/* Square thumbnail — compact */}
        <div className="w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0 relative">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name_uz} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
            >
              <span className="text-3xl opacity-40">🍽️</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-[16px] text-[#111] leading-tight flex-1 min-w-0 truncate">
              {name_uz}
            </h3>
            {open !== null && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {open ? "Ochiq" : "Yopiq"}
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-[12px] text-[#AAAAAA] mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Bottom row — distance + address */}
          <div className="flex items-center gap-3 mt-2">
            {distance_km !== undefined && distance_km > 0 && (
              <span className="text-[12px] text-[#888] font-semibold">
                📍 {distance_km < 1
                  ? `${Math.round(distance_km * 1000)}m`
                  : `${distance_km.toFixed(1)}km`}
              </span>
            )}
            {address && (
              <span className="text-[11px] text-[#CCCCCC] truncate flex-1">
                {address}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center flex-shrink-0">
          <span className="text-[#DDDDDD] text-lg">›</span>
        </div>
      </div>
    </Link>
  );
}
