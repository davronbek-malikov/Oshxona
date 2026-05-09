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
        className="bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
      >
        {/* Photo area */}
        <div className="relative h-44 overflow-hidden">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={name_uz}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              }}
            >
              <span className="text-7xl opacity-30">🍽️</span>
            </div>
          )}

          {/* Top-right badges */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {open !== null && (
              <span
                className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                  open
                    ? "bg-green-500 text-white"
                    : "bg-black/60 text-white backdrop-blur-sm"
                }`}
              >
                {open ? "Ochiq" : "Yopiq"}
              </span>
            )}
            {distance_km !== undefined && distance_km > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
                📍{" "}
                {distance_km < 1
                  ? `${Math.round(distance_km * 1000)}m`
                  : `${distance_km.toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>

        {/* Info below photo */}
        <div className="px-4 py-3">
          <h3 className="font-extrabold text-[18px] text-[#111] leading-tight">
            {name_uz}
          </h3>

          {description && (
            <p className="text-[13px] text-[#AAAAAA] mt-1 line-clamp-1 leading-relaxed">
              {description}
            </p>
          )}

          {address && !description && (
            <p className="text-[13px] text-[#AAAAAA] mt-1 truncate">
              {address}
            </p>
          )}

          {address && description && (
            <p className="text-[12px] text-[#CCCCCC] mt-1 truncate">
              📍 {address}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
