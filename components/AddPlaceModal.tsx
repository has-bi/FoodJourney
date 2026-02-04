"use client";

import { useRef, useActionState } from "react";
import { addPlace } from "@/app/actions/place";

const categories = [
  { value: "cafe", label: "☕ Cafe", icon: "☕" },
  { value: "resto", label: "🍽️ Restaurant", icon: "🍽️" },
  { value: "sushi", label: "🍣 Sushi", icon: "🍣" },
  { value: "fine_dining", label: "🥂 Fine Dining", icon: "🥂" },
  { value: "street_food", label: "🍜 Street Food", icon: "🍜" },
  { value: "dessert", label: "🍰 Dessert", icon: "🍰" },
];

export function AddPlaceModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(addPlace, null);

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
    formRef.current?.reset();
  };

  // Close modal on success
  if (state?.success) {
    dialogRef.current?.close();
    formRef.current?.reset();
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={openModal}
        className="btn btn-primary btn-circle fixed bottom-24 right-4 shadow-lg z-30 w-14 h-14"
        aria-label="Add new place"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      {/* Modal */}
      <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box p-0 max-w-md">
          {/* Header */}
          <div className="p-5 border-b border-base-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-base-content">Add New Place</h3>
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-base-content/60 mt-1">
              Paste a Google Maps link and we&apos;ll fetch the details
            </p>
          </div>

          <form ref={formRef} action={formAction} className="p-5 space-y-5">
            {/* Maps Link Input */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Google Maps Link
              </label>
              <input
                type="url"
                name="mapsLink"
                placeholder="https://maps.google.com/place/..."
                className="input input-bordered w-full bg-base-100"
                required
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <label key={cat.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      defaultChecked={cat.value === "resto"}
                      className="peer hidden"
                    />
                    <div className="flex flex-col items-center gap-1 p-3 border border-base-300 rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs text-base-content/70">{cat.label.split(" ")[1]}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Notes <span className="text-base-content/50 font-normal">(optional)</span>
              </label>
              <textarea
                name="notes"
                placeholder="e.g., Must try their signature dish! or Recommended by a friend"
                className="textarea textarea-bordered w-full bg-base-100 h-20 text-sm"
              />
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg p-3">
                {state.error}
              </div>
            )}

            {/* Loading State Info */}
            {isPending && (
              <div className="bg-info/10 border border-info/20 text-info text-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Searching for restaurant info...</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={closeModal}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isPending}
              >
                {isPending ? "Adding..." : "Add Place"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
