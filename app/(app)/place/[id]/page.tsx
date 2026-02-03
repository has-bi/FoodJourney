import { getPlaceById } from "@/app/actions/place";
import { notFound } from "next/navigation";
import Link from "next/link";

const priceLabels: Record<string, string> = {
  cheap: "$",
  moderate: "$$",
  expensive: "$$$",
  luxury: "$$$$",
};

const categoryLabels: Record<string, string> = {
  cafe: "Cafe",
  resto: "Restaurant",
  sushi: "Sushi",
  fine_dining: "Fine Dining",
  street_food: "Street Food",
  dessert: "Dessert",
};

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
          <h1 className="text-2xl font-bold">{place.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="badge badge-outline">
              {categoryLabels[place.category] || place.category}
            </span>
            {place.priceRange && (
              <span className="badge badge-ghost">
                {priceLabels[place.priceRange]}
              </span>
            )}
            {place.cuisine && (
              <span className="badge badge-ghost">{place.cuisine}</span>
            )}
          </div>
        </div>

        {/* Rating */}
        {place.rating && (
          <div>
            <p className="text-sm text-base-content/60 mb-1">Rating</p>
            <div className="text-2xl">{"⭐".repeat(place.rating)}</div>
          </div>
        )}

        {/* Visit date */}
        {place.visitedAt && (
          <div>
            <p className="text-sm text-base-content/60 mb-1">Visited</p>
            <p className="font-medium">
              {new Date(place.visitedAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Notes */}
        {place.notes && (
          <div>
            <p className="text-sm text-base-content/60 mb-1">Notes</p>
            <p className="text-base-content/80">{place.notes}</p>
          </div>
        )}

        {/* Top menus */}
        {place.topMenus && place.topMenus.length > 0 && (
          <div>
            <p className="text-sm text-base-content/60 mb-1">Recommended</p>
            <ul className="list-disc list-inside text-base-content/80">
              {place.topMenus.map((menu, i) => (
                <li key={i}>{menu}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Maps link */}
        <a
          href={place.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-block gap-2"
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
                ? "text-indigo-500"
                : "text-pink-500"
            }
          >
            {place.addedBy.displayName}
          </span>
        </div>
      </div>
    </div>
  );
}
