import { getPlaceById } from "@/app/actions/place";
import { notFound } from "next/navigation";
import Link from "next/link";

const priceCategoryLabels: Record<string, string> = {
  budget: "Budget Friendly",
  moderate: "Moderate",
  expensive: "Expensive",
  premium: "Premium",
};

const categoryLabels: Record<string, string> = {
  cafe: "Cafe",
  resto: "Restaurant",
  sushi: "Sushi",
  fine_dining: "Fine Dining",
  street_food: "Street Food",
  dessert: "Dessert",
};

interface MenuItem {
  name: string;
  price?: string;
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await getPlaceById(id);

  if (!place) {
    notFound();
  }

  const signatureMenus: MenuItem[] = (place.signatureMenus as unknown as MenuItem[]) || [];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link href="/archived" className="btn btn-ghost btn-sm gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back
      </Link>

      {/* Photo */}
      {place.photoUrl ? (
        <figure className="rounded-xl overflow-hidden aspect-video">
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </figure>
      ) : (
        <div className="rounded-xl bg-base-300 aspect-video flex items-center justify-center">
          <span className="text-6xl">🍽️</span>
        </div>
      )}

      {/* Info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">{place.name}</h1>
          {place.area && (
            <p className="text-sm text-base-content/60 mt-1">{place.area}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge badge-neutral">
              {categoryLabels[place.category] || place.category}
            </span>
            {place.cuisine && (
              <span className="badge badge-ghost">{place.cuisine}</span>
            )}
            {place.googleRating && (
              <span className="badge badge-warning gap-1">
                ★ {place.googleRating.toFixed(1)}
                {place.reviewCount && (
                  <span className="opacity-70">({place.reviewCount})</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Price Info */}
        {place.priceRangeText && (
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-base-content/60 uppercase tracking-wide">
                  Price Range
                </p>
                <p className="text-lg font-bold text-base-content mt-1">
                  {place.priceRangeText}
                </p>
              </div>
              {place.priceCategory && (
                <span className={`badge ${
                  place.priceCategory === "budget" ? "badge-success" :
                  place.priceCategory === "moderate" ? "badge-info" :
                  place.priceCategory === "expensive" ? "badge-warning" :
                  "badge-error"
                }`}>
                  {priceCategoryLabels[place.priceCategory]}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Visit date */}
        {place.visitedAt && (
          <div>
            <p className="text-sm text-base-content/60 mb-1">Visited</p>
            <p className="font-medium text-base-content">
              {new Date(place.visitedAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* User Reviews */}
        {(place.hasbiRating || place.nadyaRating) && (
          <div className="space-y-3">
            <p className="text-sm text-base-content/60">Reviews</p>

            {/* Hasbi's Review */}
            {place.hasbiRating && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-primary">Hasbi</span>
                  <span className="text-warning text-lg ml-auto">
                    {"★".repeat(place.hasbiRating)}
                    {"☆".repeat(5 - place.hasbiRating)}
                  </span>
                </div>
                {place.hasbiNotes && (
                  <p className="text-sm text-base-content/80">{place.hasbiNotes}</p>
                )}
              </div>
            )}

            {/* Nadya's Review */}
            {place.nadyaRating && (
              <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="text-sm font-medium text-secondary">Nadya</span>
                  <span className="text-warning text-lg ml-auto">
                    {"★".repeat(place.nadyaRating)}
                    {"☆".repeat(5 - place.nadyaRating)}
                  </span>
                </div>
                {place.nadyaNotes && (
                  <p className="text-sm text-base-content/80">{place.nadyaNotes}</p>
                )}
              </div>
            )}

            {/* Missing review hint */}
            {(!place.hasbiRating || !place.nadyaRating) && (
              <p className="text-xs text-base-content/40 text-center">
                {!place.hasbiRating ? "Hasbi" : "Nadya"} hasn&apos;t reviewed yet
              </p>
            )}
          </div>
        )}

        {/* Signature Menu */}
        {signatureMenus.length > 0 && (
          <div>
            <p className="text-sm text-base-content/60 mb-2">Signature Menu</p>
            <div className="space-y-2">
              {signatureMenus.map((menu, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 px-3 bg-base-100 border border-base-200 rounded-lg"
                >
                  <span className="text-sm text-base-content">{menu.name}</span>
                  {menu.price && (
                    <span className="text-sm font-medium text-primary">
                      Rp {menu.price}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Info */}
        <div className="grid grid-cols-2 gap-3">
          {place.operatingHours && (
            <div className="bg-base-100 border border-base-200 rounded-lg p-3">
              <p className="text-xs text-base-content/60 mb-1">🕐 Hours</p>
              <p className="text-sm font-medium text-base-content">{place.operatingHours}</p>
            </div>
          )}
          {place.parkingInfo && (
            <div className="bg-base-100 border border-base-200 rounded-lg p-3">
              <p className="text-xs text-base-content/60 mb-1">🅿️ Parking</p>
              <p className="text-sm font-medium text-base-content">{place.parkingInfo}</p>
            </div>
          )}
          {place.waitTime && (
            <div className="bg-base-100 border border-base-200 rounded-lg p-3">
              <p className="text-xs text-base-content/60 mb-1">⏱️ Wait Time</p>
              <p className="text-sm font-medium text-base-content">{place.waitTime}</p>
            </div>
          )}
        </div>

        {/* Warning */}
        {place.commonComplaint && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-xs font-medium text-warning uppercase tracking-wide mb-1">
              ⚠️ Heads Up
            </p>
            <p className="text-sm text-base-content">{place.commonComplaint}</p>
          </div>
        )}

        {/* Maps link */}
        <a
          href={place.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-block gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          Open in Maps
        </a>

        {/* Added by */}
        <div className="text-center text-sm text-base-content/50 pt-4">
          Added by{" "}
          <span
            className={
              place.addedBy.username === "hasbi"
                ? "text-primary"
                : "text-secondary"
            }
          >
            {place.addedBy.displayName}
          </span>
        </div>
      </div>
    </div>
  );
}
