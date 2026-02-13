"use client";

import { useRef, useActionState, useState, useEffect, useCallback, type MouseEvent } from "react";
import { addPlace } from "@/app/actions/place";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const categories = [
  { value: "cafe", label: "Ngopi", icon: "☕" },
  { value: "resto", label: "Makan", icon: "🍽️" },
  { value: "sushi", label: "Sushi", icon: "🍣" },
  { value: "fine_dining", label: "Sultan", icon: "🥂" },
  { value: "street_food", label: "Kaki Lima", icon: "🍜" },
  { value: "dessert", label: "Manis", icon: "🍰" },
];

const occasionTags = [
  { value: "birthday", label: "🎂 Ultah", description: "Buat ngerayain ultah" },
  { value: "anniversary", label: "💕 Anniv", description: "Biar date lu romantis" },
  { value: "rainy_day", label: "🌧️ Ujan-ujanan", description: "Anget-anget mantap" },
  { value: "hungry_af", label: "😤 Laper Brutal", description: "Porsinya gak ngotak" },
  { value: "comfort_food", label: "🍜 Healing", description: "Butuh dipeluk makanan" },
  { value: "budget", label: "💸 Bokek Mode", description: "Tanggal tua aman" },
  { value: "cheat_day", label: "🍔 Gas Pol", description: "Diet mah besok aja" },
  { value: "quick_bite", label: "⚡ Buru-buru", description: "Gak pake lama cuy" },
];

interface AddPlaceModalProps {
  currentUser?: "hasbi" | "nadya";
}

export function AddPlaceModal({ currentUser = "hasbi" }: AddPlaceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(addPlace, null);
  const [visitType, setVisitType] = useState<"solo" | "together">("together");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const partnerName = currentUser === "hasbi" ? "Nadya" : "Hasbi";

  const openModal = useCallback(() => {
    setVisitType("together");
    setSelectedTags([]);
    dialogRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    formRef.current?.reset();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      closeModal();
    }
  };

  // Close modal on success
  useEffect(() => {
    if (state?.success) {
      closeModal();
    }
  }, [state?.success, closeModal]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={openModal}
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground/20 bg-primary text-foreground shadow-[0_4px_0_0_rgba(61,44,44,0.12)] transition-all hover:brightness-[0.98] active:translate-y-0.5 active:shadow-[0_2px_0_0_rgba(61,44,44,0.12)]"
        aria-label="Tambah tempat baru"
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
      <dialog ref={dialogRef} className="fixed inset-0 z-50 w-full bg-transparent" onClick={handleBackdropClick}>
        <div className="flex min-h-full items-end justify-center p-3 sm:items-center sm:p-6 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-hidden overflow-y-auto rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">
          {/* Header */}
          <div className="border-b-2 border-border p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Nemu Tempat Baru? 🔥</h3>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={closeModal}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop link Google Maps-nya, ntar kita kulik detailnya
            </p>
          </div>

          <form ref={formRef} action={formAction} className="space-y-5 p-5">
            {/* Maps Link Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Link Google Maps-nya
              </label>
              <Input
                type="url"
                name="mapsLink"
                placeholder="https://maps.google.com/place/..."
                required
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Jenis tempat makan
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
                    <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-border p-3 transition-all peer-checked:border-foreground/40 peer-checked:bg-muted">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs text-muted-foreground">{cat.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Visit Type Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Mau pergi sama siapa nih?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="visitType"
                    value="solo"
                    checked={visitType === "solo"}
                    onChange={() => setVisitType("solo")}
                    className="peer hidden"
                  />
                  <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border p-3 transition-all peer-checked:border-foreground/40 peer-checked:bg-muted">
                    <span className="text-lg">🚶</span>
                    <span className="text-sm font-medium">Solo aja cuy</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="visitType"
                    value="together"
                    checked={visitType === "together"}
                    onChange={() => setVisitType("together")}
                    className="peer hidden"
                  />
                  <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border p-3 transition-all peer-checked:border-foreground/40 peer-checked:bg-muted">
                    <span className="text-lg">👫</span>
                    <span className="text-sm font-medium">Bareng si {partnerName}</span>
                  </div>
                </label>
              </div>
              {visitType === "together" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {partnerName} kudu ACC dulu baru masuk list
                </p>
              )}
            </div>

            {/* Occasion Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Cocoknya buat kapan? <span className="font-normal text-muted-foreground">(opsional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {occasionTags.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={cn(
                      "rounded-full border-2 px-3 py-1.5 text-xs transition-all",
                      selectedTags.includes(tag.value)
                        ? "border-foreground/40 bg-muted font-medium"
                        : "border-border hover:border-foreground/20"
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
            </div>

            {/* Optional Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Catetan <span className="font-normal text-muted-foreground">(opsional)</span>
              </label>
              <Textarea
                name="notes"
                placeholder="Wajib cobain ini! atau rekomendasi dari si anu..."
                className="h-20 text-sm"
              />
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="rounded-2xl border-2 border-foreground/20 bg-destructive/30 p-3 text-sm text-foreground">
                {state.error}
              </div>
            )}

            {/* Loading State Info */}
            {isPending && (
              <div className="rounded-2xl border-2 border-border bg-muted p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Lagi nyari info restonya nih, bentar...</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={closeModal} disabled={isPending}>
                Gajadi
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Bentar..." : "Gas Masukin! 🚀"}
              </Button>
            </div>
          </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
