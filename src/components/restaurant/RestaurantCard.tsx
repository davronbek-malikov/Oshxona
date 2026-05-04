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
  avgRating?: number;
}

function isOpen(opening: string | null | undefined, closing: string | null | undefined) {
  if (!opening || !closing) return null;
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return hhmm >= opening && hhmm <= closing;
}

export function RestaurantCard({
  id,
  name_uz,
  description,
  address,
  distance_km,
  photos,
  opening_time,
  closing_time,
}: Props) {
  const open = isOpen(opening_time, closing_time);
  const photo = photos?.[0];

  return (
    <Link href={`/menu/${id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
        {/* Photo */}
        <div className="h-36 bg-gray-100 relative overflow-hidden">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={name_uz}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🍽️</span>
            </div>
          )}
          {open !== null && (
            <span
              className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${
                open
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {open ? "Ochiq" : "Yopiq"}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base leading-tight">{name_uz}</h3>
            {distance_km !== undefined && (
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                📍 {distance_km < 1
                  ? `${Math.round(distance_km * 1000)} m`
                  : `${distance_km.toFixed(1)} km`}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {description}
            </p>
          )}
          {address && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {address}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
