import { getPlacesByStatus } from "@/app/actions/place";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { PlaceWithUser } from "@/lib/types";
import Link from "next/link";

const priceCategoryLabels: Record<string, string> = {
  budget: "$",
  moderate: "$$",
  expensive: "$$$",
  premium: "$$$$",
};

export default async function ArchivedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const places = (await getPlacesByStatus("archived")) as PlaceWithUser[];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Visited Places</h1>

      {places.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {places.map((place) => (
            <Link
              key={place.id}
              href={`/place/${place.id}`}
              className="card bg-base-100 shadow-md overflow-hidden"
            >
              {place.photoUrl ? (
                <figure className="aspect-square">
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                </figure>
              ) : (
                <div className="aspect-square bg-base-300 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
              <div className="card-body p-3">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {place.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-base-content/60">
                  <div className="flex items-center gap-1">
                    {place.hasbiRating && (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-warning">{"★".repeat(place.hasbiRating)}</span>
                      </span>
                    )}
                    {place.nadyaRating && (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="text-warning">{"★".repeat(place.nadyaRating)}</span>
                      </span>
                    )}
                    {!place.hasbiRating && !place.nadyaRating && (
                      <span>No ratings</span>
                    )}
                  </div>
                  {place.priceCategory && (
                    <span>{priceCategoryLabels[place.priceCategory]}</span>
                  )}
                </div>
                {place.visitedAt && (
                  <p className="text-xs text-base-content/50">
                    {new Date(place.visitedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-base-content/60 mb-2">No visits yet</p>
          <p className="text-sm text-base-content/40">
            Mark planned places as visited to add them here
          </p>
        </div>
      )}
    </div>
  );
}
