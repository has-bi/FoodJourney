"use client";

import { useRef, useState, useTransition } from "react";
import { archivePlace } from "@/app/actions/place";
import { StarRating } from "./StarRating";
import type { PlaceWithUser } from "@/lib/types";

interface ArchiveModalProps {
  place: PlaceWithUser;
  onClose: () => void;
  onSuccess: () => void;
}

export function ArchiveModal({ place, onClose, onSuccess }: ArchiveModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [photoUrl, setPhotoUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Open modal on mount
  useState(() => {
    dialogRef.current?.showModal();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await archivePlace(
        place.id,
        new Date(visitDate),
        rating,
        notes,
        photoUrl || undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  };

  return (
    <dialog ref={dialogRef} className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Mark as Visited</h3>
        <p className="text-sm text-base-content/70 mb-4">{place.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Visit Date</span>
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Rating</span>
            </label>
            <StarRating rating={rating} onChange={setRating} />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Photo URL (optional)</span>
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="input input-bordered w-full"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Paste a link to your photo
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes (optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was it?"
              className="textarea textarea-bordered w-full"
              rows={3}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                "Save Visit"
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
