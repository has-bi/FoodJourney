"use client";

import { useRef, useActionState } from "react";
import { addPlace } from "@/app/actions/place";

const categories = [
  { value: "cafe", label: "Cafe" },
  { value: "resto", label: "Restaurant" },
  { value: "sushi", label: "Sushi" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "street_food", label: "Street Food" },
  { value: "dessert", label: "Dessert" },
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
        className="btn btn-primary btn-circle fixed bottom-20 right-4 shadow-lg z-20"
        aria-label="Add new place"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
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
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Place</h3>

          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Google Maps Link</span>
              </label>
              <input
                type="url"
                name="mapsLink"
                placeholder="https://maps.google.com/..."
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Paste the link from Google Maps
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                name="category"
                className="select select-bordered w-full"
                defaultValue="resto"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {state?.error && (
              <div className="alert alert-error">
                <span>{state.error}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeModal}
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
                    Extracting...
                  </>
                ) : (
                  "Add Place"
                )}
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
