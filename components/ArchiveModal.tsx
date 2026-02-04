"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import type { PlaceWithUser, Username } from "@/lib/types";
import { addVisitReview } from "@/app/actions/place";

interface ArchiveModalProps {
  place: PlaceWithUser;
  currentUser: Username;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ArchiveModal({
  place,
  currentUser,
  onClose,
  onSuccess,
}: ArchiveModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Check if partner already reviewed
  const partnerReviewed = currentUser === "hasbi"
    ? place.nadyaRating !== null
    : place.hasbiRating !== null;

  // Check if photo already exists
  const hasExistingPhoto = !!place.photoUrl;
  const hasExistingDate = !!place.visitedAt;

  const [visitDate, setVisitDate] = useState(
    hasExistingDate
      ? new Date(place.visitedAt!).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    hasExistingPhoto ? place.photoUrl : null
  );
  const [error, setError] = useState<string | null>(null);

  // Open modal on mount
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    startTransition(async () => {
      // Only send new photo if it's different from existing
      const newPhoto = photoPreview !== place.photoUrl ? photoPreview : undefined;

      const result = await addVisitReview(
        place.id,
        currentUser,
        new Date(visitDate),
        rating,
        notes,
        newPhoto || undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.();
        onClose();
      }
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const displayName = currentUser === "hasbi" ? "Hasbi" : "Nadya";
  const partnerName = currentUser === "hasbi" ? "Nadya" : "Hasbi";
  const userColor = currentUser === "hasbi" ? "text-primary" : "text-secondary";

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
    >
      <div className="modal-box max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 border-b border-base-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-base-content">
                {partnerReviewed ? "Add Your Review" : "Mark as Visited"}
              </h3>
              <p className="text-sm text-base-content/60 mt-1">{place.name}</p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              disabled={isPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Partner's review status */}
          {partnerReviewed && (
            <div className={`bg-${currentUser === "hasbi" ? "secondary" : "primary"}/10 border border-${currentUser === "hasbi" ? "secondary" : "primary"}/20 rounded-lg p-3`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${currentUser === "hasbi" ? "bg-secondary" : "bg-primary"}`} />
                <span className="text-sm font-medium">{partnerName} already reviewed</span>
                <span className="text-warning text-sm ml-auto">
                  {"★".repeat(currentUser === "hasbi" ? (place.nadyaRating || 0) : (place.hasbiRating || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Photo Upload - only show upload option if no existing photo */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Photo {hasExistingPhoto ? "(already uploaded)" : "(shared between both)"}
            </label>
            <div
              onClick={() => !hasExistingPhoto && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-base-300 rounded-xl p-4 text-center transition-colors ${
                hasExistingPhoto ? "cursor-default" : "cursor-pointer hover:border-primary/50"
              }`}
            >
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  {!hasExistingPhoto && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mx-auto text-base-content/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-base-content/50 mt-2">
                    Tap to upload a photo
                  </p>
                </div>
              )}
            </div>
            {!hasExistingPhoto && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            )}
          </div>

          {/* Visit Date - only editable if not already set */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Visit Date {hasExistingDate ? "(set by partner)" : ""}
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="input input-bordered w-full bg-base-100"
              required
              disabled={hasExistingDate}
            />
          </div>

          {/* Rating Header */}
          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  currentUser === "hasbi" ? "bg-primary" : "bg-secondary"
                }`}
              />
              <span className={`text-sm font-semibold ${userColor}`}>
                {displayName}&apos;s Review
              </span>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs text-base-content/60 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-all ${
                      star <= rating
                        ? "text-warning scale-110"
                        : "text-base-300 hover:text-warning/50"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-xs text-base-content/60 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you think? Any favorite dishes?"
                className="textarea textarea-bordered w-full bg-base-100 h-20 text-sm"
              />
            </div>
          </div>

          {/* Status hint */}
          <p className="text-xs text-base-content/50 text-center">
            {partnerReviewed
              ? "This will complete the visit and move to Visited list"
              : `${partnerName} also needs to review before moving to Visited`
            }
          </p>

          {/* Error */}
          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </span>
              ) : (
                "Save Review"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
