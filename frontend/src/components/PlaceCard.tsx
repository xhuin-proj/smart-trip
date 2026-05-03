import type { Place } from "@/lib/types";


export default function PlaceCard({ place }: { place: Place }) {
  const budgetLabel = place.budgetlevel
    ? ["", "$", "$$", "$$$", "$$$$"][place.budgetlevel] ?? null
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {place.imageurl ? (
        <img
          src={place.imageurl}
          alt={place.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      )}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{place.name}</h3>
          {budgetLabel && (
            <span className="text-xs text-gray-500 shrink-0">{budgetLabel}</span>
          )}
        </div>
        <span className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 self-start">
          { place.category}
        </span>
        {place.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">
            {place.description}
          </p>
        )}
      </div>
    </div>
  );
}
