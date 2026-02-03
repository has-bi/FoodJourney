"use client";

import type { PlaceWithUser, Username } from "@/lib/types";
import { ApprovalButtons } from "./ApprovalButtons";

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

interface PlaceCardProps {
  place: PlaceWithUser;
  currentUser: Username;
  showActions?: boolean;
  onArchive?: (place: PlaceWithUser) => void;
}

export function PlaceCard({
  place,
  currentUser,
  showActions = false,
  onArchive,
}: PlaceCardProps) {
  const borderColor =
    place.addedBy.username === "hasbi"
      ? "border-l-indigo-500"
      : "border-l-pink-500";

  const needsApproval =
    place.status === "suggested" &&
    ((currentUser === "hasbi" && !place.hasbiApproved) ||
      (currentUser === "nadya" && !place.nadyaApproved));

  return (
    <div className={`card bg-base-100 shadow-md border-l-4 ${borderColor}`}>
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <h2 className="card-title text-lg">{place.name}</h2>
          {place.status === "archived" && place.rating && (
            <div className="badge badge-ghost">
              {"⭐".repeat(place.rating)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge badge-outline badge-sm">
            {categoryLabels[place.category] || place.category}
          </span>
          {place.priceRange && (
            <span className="badge badge-ghost badge-sm">
              {priceLabels[place.priceRange]}
            </span>
          )}
          {place.cuisine && (
            <span className="text-base-content/60">{place.cuisine}</span>
          )}
        </div>

        {place.topMenus && place.topMenus.length > 0 && (
          <p className="text-sm text-base-content/70">
            Top picks: {place.topMenus.slice(0, 3).join(", ")}
          </p>
        )}

        {place.worstReview && place.status !== "archived" && (
          <p className="text-sm italic text-error/80">
            &quot;{place.worstReview}&quot;
          </p>
        )}

        {place.status === "archived" && place.notes && (
          <p className="text-sm text-base-content/70">{place.notes}</p>
        )}

        {place.status === "suggested" && (
          <div className="flex items-center gap-2 mt-2 text-xs text-base-content/60">
            <span>
              Hasbi {place.hasbiApproved ? "✅" : "⏳"}
            </span>
            <span>|</span>
            <span>
              Nadya {place.nadyaApproved ? "✅" : "⏳"}
            </span>
          </div>
        )}

        {showActions && needsApproval && (
          <ApprovalButtons placeId={place.id} />
        )}

        {place.status === "planned" && onArchive && (
          <div className="card-actions justify-end mt-3">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onArchive(place)}
            >
              Mark as Visited
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-2 text-xs text-base-content/50">
          <span>
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
          </span>
          {place.visitedAt && (
            <span>
              Visited {new Date(place.visitedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
