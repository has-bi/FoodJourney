"use client";

import { useState } from "react";
import type { PlaceWithUser, Username } from "@/lib/types";
import { ApprovalButtons } from "./ApprovalButtons";
import { PlaceDetailModal } from "./PlaceDetailModal";

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

interface PlaceCardProps {
  place: PlaceWithUser;
  currentUser: Username;
  showActions?: boolean;
  onArchive?: (place: PlaceWithUser) => void;
  onRefresh?: () => void;
}

export function PlaceCard({
  place,
  currentUser,
  showActions = false,
  onArchive,
  onRefresh,
}: PlaceCardProps) {
  const [showModal, setShowModal] = useState(false);

  const borderColor =
    place.addedBy.username === "hasbi"
      ? "border-l-primary"
      : "border-l-secondary";

  const needsApproval =
    place.status === "suggested" &&
    ((currentUser === "hasbi" && !place.hasbiApproved) ||
      (currentUser === "nadya" && !place.nadyaApproved));

  const signatureMenus: MenuItem[] = (place.signatureMenus as unknown as MenuItem[]) || [];

  // For planned status - check review status
  const currentUserReviewed = currentUser === "hasbi"
    ? place.hasbiRating !== null
    : place.nadyaRating !== null;

  const partnerReviewed = currentUser === "hasbi"
    ? place.nadyaRating !== null
    : place.hasbiRating !== null;

  return (
    <>
      <div
        className={`card bg-base-100 shadow-sm border-l-4 ${borderColor} card-clickable cursor-pointer`}
        onClick={() => setShowModal(true)}
      >
        <div className="card-body p-4">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-base-content text-base leading-tight">
                {place.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-base-content/60">
                <span>{categoryLabels[place.category]}</span>
                {place.cuisine && (
                  <>
                    <span className="text-base-content/30">·</span>
                    <span>{place.cuisine}</span>
                  </>
                )}
              </div>
            </div>

            {/* Rating */}
            {place.googleRating && (
              <div className="flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-lg">
                <span className="text-warning text-sm">★</span>
                <span className="font-semibold text-sm text-base-content">
                  {place.googleRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Price & Location */}
          <div className="flex items-center gap-2 mt-2">
            {place.priceRangeText && (
              <span className={`badge badge-sm ${
                place.priceCategory === "budget" ? "badge-success" :
                place.priceCategory === "moderate" ? "badge-info" :
                place.priceCategory === "expensive" ? "badge-warning" :
                "badge-error"
              }`}>
                {place.priceRangeText}
              </span>
            )}
            {place.area && (
              <span className="text-xs text-base-content/50">{place.area}</span>
            )}
          </div>

          {/* Menu Preview */}
          {signatureMenus.length > 0 && (
            <p className="text-xs text-base-content/60 mt-2 line-clamp-1">
              🍽️ {signatureMenus.slice(0, 2).map(m => m.name).join(", ")}
              {signatureMenus.length > 2 && ` +${signatureMenus.length - 2}`}
            </p>
          )}

          {/* Suggested Notes */}
          {place.suggestedNotes && place.status === "suggested" && (
            <p className="text-xs text-base-content/70 mt-2 italic line-clamp-2">
              &ldquo;{place.suggestedNotes}&rdquo;
            </p>
          )}

          {/* Warning - compact */}
          {place.commonComplaint && place.status !== "archived" && place.status !== "planned" && (
            <p className="text-xs text-warning/80 mt-1 line-clamp-1">
              ⚠️ {place.commonComplaint}
            </p>
          )}

          {/* Archived ratings */}
          {place.status === "archived" && (place.hasbiRating || place.nadyaRating) && (
            <div className="flex items-center gap-3 text-xs mt-2">
              {place.hasbiRating && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-warning">{"★".repeat(place.hasbiRating)}</span>
                </span>
              )}
              {place.nadyaRating && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-warning">{"★".repeat(place.nadyaRating)}</span>
                </span>
              )}
            </div>
          )}

          {/* Planned - Review Status */}
          {place.status === "planned" && (place.hasbiRating || place.nadyaRating) && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-base-200">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${place.hasbiRating ? "bg-success" : "bg-base-300"}`} />
                <span className="text-xs text-base-content/60">Hasbi</span>
                {place.hasbiRating && (
                  <span className="text-warning text-xs">{"★".repeat(place.hasbiRating)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${place.nadyaRating ? "bg-success" : "bg-base-300"}`} />
                <span className="text-xs text-base-content/60">Nadya</span>
                {place.nadyaRating && (
                  <span className="text-warning text-xs">{"★".repeat(place.nadyaRating)}</span>
                )}
              </div>
            </div>
          )}

          {/* Approval Status */}
          {place.status === "suggested" && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-base-200">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${place.hasbiApproved ? "bg-success" : "bg-base-300"}`} />
                <span className="text-xs text-base-content/60">Hasbi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${place.nadyaApproved ? "bg-success" : "bg-base-300"}`} />
                <span className="text-xs text-base-content/60">Nadya</span>
              </div>
              <span className="text-xs text-base-content/40 ml-auto">
                by {place.addedBy.displayName}
              </span>
            </div>
          )}

          {/* Actions - stop propagation to prevent modal */}
          {showActions && needsApproval && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2">
              <ApprovalButtons placeId={place.id} />
            </div>
          )}

          {place.status === "planned" && onArchive && !currentUserReviewed && (
            <div onClick={(e) => e.stopPropagation()} className="mt-3">
              <button
                className={`btn btn-sm w-full ${currentUser === "hasbi" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => onArchive(place)}
              >
                {partnerReviewed ? "Add Your Review" : "Mark as Visited"}
              </button>
            </div>
          )}

          {/* Already reviewed indicator */}
          {place.status === "planned" && currentUserReviewed && !partnerReviewed && (
            <div className="mt-3 text-center">
              <span className="text-xs text-base-content/50">
                Waiting for {currentUser === "hasbi" ? "Nadya" : "Hasbi"}&apos;s review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <PlaceDetailModal
          place={place}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onAddReview={
            place.status === "planned" && !currentUserReviewed
              ? () => {
                  setShowModal(false);
                  onArchive?.(place);
                }
              : undefined
          }
        />
      )}
    </>
  );
}
