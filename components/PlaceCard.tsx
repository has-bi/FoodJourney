"use client";

import { useState } from "react";
import type { PlaceWithUser, Username } from "@/lib/types";
import { ApprovalButtons } from "./ApprovalButtons";
import { PlaceDetailModal } from "./PlaceDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categoryLabels: Record<string, string> = {
  cafe: "Ngopi ☕",
  resto: "Makan 🍽️",
  sushi: "Sushi 🍣",
  fine_dining: "Mewah ✨",
  street_food: "Jajanan 🍢",
  dessert: "Manis 🍰",
};

const tagLabels: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💕",
  rainy_day: "🌧️",
  hungry_af: "😤",
  comfort_food: "🍜",
  budget: "💸",
  cheat_day: "🍔",
  quick_bite: "⚡",
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
  onNewVisit?: (place: PlaceWithUser) => void;
}

export function PlaceCard({
  place,
  currentUser,
  showActions = false,
  onArchive,
  onNewVisit,
}: PlaceCardProps) {
  const [showModal, setShowModal] = useState(false);

  const needsApproval =
    place.status === "suggested" &&
    ((currentUser === "hasbi" && !place.hasbiApproved) ||
      (currentUser === "nadya" && !place.nadyaApproved));

  const signatureMenus: MenuItem[] = (place.signatureMenus as unknown as MenuItem[]) || [];
  const tags: string[] = (place.tags as string[]) || [];
  const isSolo = place.visitType === "solo";

  // For planned status - check review status
  const currentUserReviewed = currentUser === "hasbi"
    ? place.hasbiRating !== null
    : place.nadyaRating !== null;

  const partnerReviewed = currentUser === "hasbi"
    ? place.nadyaRating !== null
    : place.hasbiRating !== null;

  // For solo visits, only check if the person who added it has reviewed
  // For together visits, check if partner has reviewed but current user hasn't
  const needsYourReview = place.status === "planned" && !isSolo && partnerReviewed && !currentUserReviewed;

  // For solo visits: just show action label
  // For together visits: show appropriate label based on review status
  const actionLabel = isSolo
    ? (currentUserReviewed ? "Udah Review" : "Udah Mampir!")
    : (currentUserReviewed
        ? "Udah Review"
        : partnerReviewed
        ? "Giliran Lu Review!"
        : "Udah Mampir!");

  return (
    <>
      <div
        className={`card-clickable cursor-pointer rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_rgba(61,44,44,0.08)] ${needsYourReview ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-background" : ""}`}
        onClick={() => setShowModal(true)}
      >
        <div className="p-4">
          {/* Visit Type & Tags */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {/* Visit count for archived places */}
            {place.status === "archived" && place.visitCount > 0 && (
              <Badge variant="success" className="text-[10px]">
                {place.visitCount}x kesini
              </Badge>
            )}
            {/* Solo indicator */}
            {isSolo && (
              <Badge variant="outline" className="text-[10px] bg-muted/50">
                🚶 Solo
              </Badge>
            )}
            {/* Needs Your Review Badge */}
            {needsYourReview && (
              <Badge variant="warning" className="text-[10px]">
                Giliran lu!
              </Badge>
            )}
            {/* Occasion Tags */}
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs" title={tag}>
                {tagLabels[tag] || tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-medium leading-tight text-foreground">
                {place.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{categoryLabels[place.category]}</span>
                {place.cuisine && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{place.cuisine}</span>
                  </>
                )}
              </div>
            </div>

            {/* Rating */}
            {place.googleRating && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <span className="text-foreground text-sm">★</span>
                <span className="text-sm font-medium text-foreground">
                  {place.googleRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Price & Location */}
          <div className="flex items-center gap-2 mt-2">
            {place.priceRangeText && (
              <Badge
                variant={
                  place.priceCategory === "budget"
                    ? "success"
                    : place.priceCategory === "moderate"
                    ? "info"
                    : place.priceCategory === "expensive"
                    ? "warning"
                    : "destructive"
                }
                className="text-[11px]"
              >
                {place.priceRangeText}
              </Badge>
            )}
            {place.area && (
              <span className="text-xs text-muted-foreground">{place.area}</span>
            )}
          </div>

          {/* Menu Preview */}
          {signatureMenus.length > 0 && (
            <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
              🍽️ {signatureMenus.slice(0, 2).map(m => m.name).join(", ")}
              {signatureMenus.length > 2 && ` +${signatureMenus.length - 2}`}
            </p>
          )}

          {/* Suggested Notes */}
          {place.suggestedNotes && place.status === "suggested" && (
            <p className="mt-2 line-clamp-2 text-xs italic text-foreground/70">
              &ldquo;{place.suggestedNotes}&rdquo;
            </p>
          )}

          {/* Warning - compact */}
          {place.commonComplaint && place.status !== "archived" && place.status !== "planned" && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              ⚠️ {place.commonComplaint}
            </p>
          )}

          {/* Archived ratings */}
          {place.status === "archived" && (place.hasbiRating || place.nadyaRating) && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              {place.hasbiRating && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-foreground">{"★".repeat(place.hasbiRating)}</span>
                </span>
              )}
              {place.nadyaRating && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  <span className="text-foreground">{"★".repeat(place.nadyaRating)}</span>
                </span>
              )}
            </div>
          )}

          {/* Planned - Review Status (only for together visits with at least one review) */}
          {place.status === "planned" && !isSolo && (place.hasbiRating || place.nadyaRating) && (
            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${place.hasbiRating ? "bg-success" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">Hasbi</span>
                {place.hasbiRating && (
                  <span className="text-foreground text-xs">{"★".repeat(place.hasbiRating)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${place.nadyaRating ? "bg-success" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">Nadya</span>
                {place.nadyaRating && (
                  <span className="text-foreground text-xs">{"★".repeat(place.nadyaRating)}</span>
                )}
              </div>
            </div>
          )}

          {/* Approval Status */}
          {place.status === "suggested" && (
            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${place.hasbiApproved ? "bg-success" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">Hasbi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${place.nadyaApproved ? "bg-success" : "bg-muted"}`} />
                <span className="text-xs text-muted-foreground">Nadya</span>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                usulan {place.addedBy.displayName}
              </span>
            </div>
          )}

          {/* Actions - stop propagation to prevent modal */}
          {showActions && needsApproval && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2">
              <ApprovalButtons placeId={place.id} />
            </div>
          )}

          {place.status === "planned" && onArchive && (
            <div onClick={(e) => e.stopPropagation()} className="mt-3">
              <Button
                size="sm"
                variant={currentUser === "hasbi" ? "default" : "secondary"}
                className="w-full"
                onClick={() => onArchive(place)}
                disabled={currentUserReviewed}
              >
                {actionLabel}
              </Button>
            </div>
          )}

          {/* Already reviewed indicator - only for together visits */}
          {place.status === "planned" && !isSolo && currentUserReviewed && !partnerReviewed && (
            <div className="mt-3 text-center">
              <span className="text-xs text-muted-foreground">
                Nunggu {currentUser === "hasbi" ? "Nadya" : "Hasbi"} review dulu nih
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
          onNewVisit={
            place.status === "archived" && onNewVisit
              ? () => {
                  setShowModal(false);
                  onNewVisit?.(place);
                }
              : undefined
          }
        />
      )}
    </>
  );
}
