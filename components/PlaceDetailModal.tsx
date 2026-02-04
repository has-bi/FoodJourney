"use client";

import { useEffect, useRef } from "react";
import type { PlaceWithUser, Username } from "@/lib/types";

interface MenuItem {
  name: string;
  price?: string;
}

interface PlaceDetailModalProps {
  place: PlaceWithUser;
  currentUser?: Username;
  onClose: () => void;
  onAddReview?: () => void;
}

const categoryLabels: Record<string, string> = {
  cafe: "Cafe",
  resto: "Restaurant",
  sushi: "Sushi",
  fine_dining: "Fine Dining",
  street_food: "Street Food",
  dessert: "Dessert",
};

const priceCategoryLabels: Record<string, string> = {
  budget: "Budget Friendly",
  moderate: "Moderate",
  expensive: "Expensive",
  premium: "Premium",
};

export function PlaceDetailModal({ place, currentUser, onClose, onAddReview }: PlaceDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const signatureMenus: MenuItem[] = (place.signatureMenus as unknown as MenuItem[]) || [];

  // Check if current user can add a review (for both planned and archived)
  const canAddReview = currentUser && (place.status === "archived" || place.status === "planned") && (
    (currentUser === "hasbi" && !place.hasbiRating) ||
    (currentUser === "nadya" && !place.nadyaRating)
  );

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
    >
      <div className="modal-box max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 border-b border-base-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-base-content">{place.name}</h3>
              {place.area && (
                <p className="text-sm text-base-content/60 mt-1">{place.area}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge badge-neutral badge-sm">
              {categoryLabels[place.category] || place.category}
            </span>
            {place.cuisine && (
              <span className="badge badge-ghost badge-sm">{place.cuisine}</span>
            )}
            {place.googleRating && (
              <span className="badge badge-warning badge-sm gap-1">
                <span>★</span>
                {place.googleRating.toFixed(1)}
                {place.reviewCount && (
                  <span className="opacity-70">({place.reviewCount})</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Suggested Notes */}
          {place.suggestedNotes && (
            <div className="bg-base-200 rounded-lg p-4">
              <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
                Notes from {place.addedBy.displayName}
              </p>
              <p className="text-sm text-base-content italic">
                &ldquo;{place.suggestedNotes}&rdquo;
              </p>
            </div>
          )}

          {/* Price Info */}
          {place.priceRangeText && (
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide">
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

          {/* Signature Menu */}
          {signatureMenus.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                <span>🍽️</span> Signature Menu
              </h4>
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

          {/* Warning/Complaint */}
          {place.commonComplaint && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-xs font-medium text-warning uppercase tracking-wide mb-1">
                ⚠️ Heads Up
              </p>
              <p className="text-sm text-base-content">{place.commonComplaint}</p>
            </div>
          )}

          {/* User Reviews (for archived or planned with partial reviews) */}
          {(place.status === "archived" || place.status === "planned") && (place.hasbiRating || place.nadyaRating) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-base-content flex items-center gap-2">
                <span>⭐</span> Reviews
              </h4>

              {/* Hasbi's Review */}
              {place.hasbiRating && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-primary">Hasbi</span>
                    <span className="text-warning text-sm ml-auto">
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
                    <span className="text-warning text-sm ml-auto">
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

          {/* AI Confidence */}
          {place.aiConfidence && place.aiConfidence !== "high" && (
            <p className="text-xs text-center text-base-content/40">
              Data confidence: {place.aiConfidence} - some info may be incomplete
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 bg-base-100">
          {/* Add Review Button */}
          {canAddReview && onAddReview && (
            <button
              onClick={onAddReview}
              className={`btn btn-sm w-full mb-3 ${
                currentUser === "hasbi" ? "btn-primary" : "btn-secondary"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Add Your Review
            </button>
          )}

          <div className="flex gap-2">
            <a
              href={place.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm flex-1 gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Maps
            </a>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              Close
            </button>
          </div>

          {/* Added by */}
          <p className="text-xs text-center text-base-content/50 mt-3">
            Added by{" "}
            <span className={place.addedBy.username === "hasbi" ? "text-primary" : "text-secondary"}>
              {place.addedBy.displayName}
            </span>
            {place.visitedAt && (
              <span> · Visited {new Date(place.visitedAt).toLocaleDateString()}</span>
            )}
          </p>
        </div>
      </div>
    </dialog>
  );
}
