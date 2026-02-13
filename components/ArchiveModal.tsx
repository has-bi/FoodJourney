"use client";

import { useRef, useState, useTransition, useEffect, type ChangeEvent, type FormEvent, type MouseEvent } from "react";
import Image from "next/image";
import type { PlaceWithUser, Username, OrderedItem, Visit } from "@/lib/types";
import { addVisitReview, createNewVisit } from "@/app/actions/place";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-url";

interface ArchiveModalProps {
  place: PlaceWithUser;
  currentUser: Username;
  onClose: () => void;
  onSuccess?: () => void;
  existingVisit?: Visit; // If adding review to existing visit
  isNewVisit?: boolean; // If creating a new visit for archived place
}

export function ArchiveModal({
  place,
  currentUser,
  onClose,
  onSuccess,
  existingVisit,
  isNewVisit = false,
}: ArchiveModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Check visit type
  const isSolo = place.visitType === "solo";

  // For existing visit, check if partner reviewed that visit
  // For new flow, check the latest visit
  const partnerReviewed = !isSolo && existingVisit
    ? (currentUser === "hasbi" ? existingVisit.nadyaRating !== null : existingVisit.hasbiRating !== null)
    : !isSolo && (currentUser === "hasbi" ? place.nadyaRating !== null : place.hasbiRating !== null);

  // Check if photo already exists (for existing visit)
  const hasExistingPhoto = existingVisit ? !!existingVisit.photoUrl : !!place.photoUrl;
  const hasExistingDate = existingVisit ? !!existingVisit.visitedAt : !!place.visitedAt;

  const [visitDate, setVisitDate] = useState(
    hasExistingDate && !isNewVisit
      ? new Date(existingVisit?.visitedAt || place.visitedAt!).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Ordered items state
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemNote, setNewItemNote] = useState("");

  const addOrderedItem = () => {
    if (!newItemName.trim()) return;
    setOrderedItems([
      ...orderedItems,
      { name: newItemName.trim(), notes: newItemNote.trim() || undefined },
    ]);
    setNewItemName("");
    setNewItemNote("");
  };

  const removeOrderedItem = (index: number) => {
    setOrderedItems(orderedItems.filter((_, i) => i !== index));
  };

  // Open modal on mount
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Pilih file gambar dong, cuy");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 5MB ya");
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    const total = photoFiles.length + newFiles.length;
    if (total > 5) {
      setError("Maksimal 5 foto ya");
      newPreviews.forEach(URL.revokeObjectURL);
      return;
    }

    setPhotoFiles((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    setError(null);
    // Reset input so the same file(s) can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Kasih bintang dulu, jangan kosong");
      return;
    }

    startTransition(async () => {
      // Upload photos via API route (avoids Server Action serialization limit)
      const uploadedKeys: string[] = [];
      if (photoFiles.length > 0) {
        try {
          for (const file of photoFiles) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", `visits/${place.id}`);
            const res = await fetch("/api/images", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Gagal upload gambar");
              return;
            }
            uploadedKeys.push(data.key);
          }
        } catch {
          setError("Gagal upload gambar, coba lagi");
          return;
        }
      }

      let result;
      const photoKeys = uploadedKeys.length > 0 ? uploadedKeys : undefined;

      if (isNewVisit) {
        // Creating a brand new visit for an archived place
        result = await createNewVisit(
          place.id,
          currentUser,
          new Date(visitDate),
          rating,
          notes,
          photoKeys,
          orderedItems.length > 0 ? orderedItems : undefined
        );
      } else {
        // Adding review to planned place or existing visit
        result = await addVisitReview(
          place.id,
          currentUser,
          new Date(visitDate),
          rating,
          notes,
          photoKeys,
          orderedItems.length > 0 ? orderedItems : undefined,
          existingVisit?.id
        );
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.();
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      }
    });
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const displayName = currentUser === "hasbi" ? "Hasbi" : "Nadya";
  const partnerName = currentUser === "hasbi" ? "Nadya" : "Hasbi";
  const userColor = currentUser === "hasbi" ? "text-primary" : "text-secondary";
  const partnerAccent = "bg-muted border-border";
  const partnerDot = currentUser === "hasbi" ? "bg-secondary" : "bg-primary";

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full bg-transparent"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-end justify-center p-3 sm:items-center sm:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-hidden overflow-y-auto rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center p-10 text-center gap-4">
            <span className="text-5xl animate-bounce">🤤</span>
            <h3 className="text-xl font-bold text-foreground">
              Buset, shedep bener makanannyoooo
            </h3>
            <p className="text-sm text-muted-foreground">{place.name} udah masuk catetan!</p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: rating }).map((_, i) => (
                <span key={i} className="text-lg">⭐</span>
              ))}
            </div>
          </div>
        ) : (<>

        {/* Header */}
        <div className="border-b-2 border-border bg-card p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-foreground">
                {isNewVisit ? "Mampir Lagi Nih! 🔄" : partnerReviewed ? "Giliran Lu Review! 📝" : "Udah Mampir Belom? 🍽️"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{place.name}</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="rounded-full"
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
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {/* Partner's review status */}
          {partnerReviewed && (
            <div className={cn("rounded-2xl border-2 p-3", partnerAccent)}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", partnerDot)} />
                <span className="text-sm font-medium">{partnerName} udah review duluan nih</span>
                <span className="text-foreground text-sm ml-auto">
                  {"★".repeat(currentUser === "hasbi" ? (place.nadyaRating || 0) : (place.hasbiRating || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Foto 📸 {photoPreviews.length > 0 && <span className="text-muted-foreground font-normal">({photoPreviews.length}/5)</span>}
            </label>

            {/* Photo previews grid */}
            {photoPreviews.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={preview}
                      alt={`Foto ${index + 1}`}
                      fill
                      unoptimized
                      className="rounded-xl object-cover"
                    />
                    <Button
                      type="button"
                      onClick={() => removePhoto(index)}
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {photoPreviews.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary/50"
              >
                <div className="py-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-8 w-8 text-muted-foreground/60"
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
                  <p className="mt-1 text-sm text-muted-foreground">
                    {photoPreviews.length === 0 ? "Tap sini buat upload foto" : "Tambah foto lagi"}
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Visit Date - only editable if not already set */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Tanggal mampir {hasExistingDate && !isNewVisit ? "(udah diisi)" : "📅"}
            </label>
            <Input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
              disabled={hasExistingDate && !isNewVisit}
            />
          </div>

          {/* Ordered Items - Pesen apa aja? */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Pesen apa aja? 🍽️
            </label>

            {/* Added items list */}
            {orderedItems.length > 0 && (
              <div className="mb-3 space-y-2">
                {orderedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl bg-muted px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.notes && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          - {item.notes}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOrderedItem(index)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
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
                  </div>
                ))}
              </div>
            )}

            {/* Add new item form */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nama menu yang dipesen"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOrderedItem();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrderedItem}
                  disabled={!newItemName.trim()}
                  className="shrink-0"
                >
                  +
                </Button>
              </div>
              {newItemName && (
                <Input
                  value={newItemNote}
                  onChange={(e) => setNewItemNote(e.target.value)}
                  placeholder="Catetan (opsional): Enak parah, kebanyakan garam..."
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOrderedItem();
                    }
                  }}
                />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Catat menu favorit biar inget pas balik lagi! 😋
            </p>
          </div>

          {/* Rating Header */}
          <div className="rounded-2xl bg-muted p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  currentUser === "hasbi" ? "bg-primary" : "bg-secondary"
                }`}
              />
              <span className={`text-sm font-medium ${userColor}`}>
                Review {displayName}
              </span>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="mb-2 block text-xs text-muted-foreground">
                Kasih bintang dong
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-all ${
                      star <= rating
                        ? "text-foreground scale-110"
                        : "text-muted-foreground/60 hover:text-foreground/70"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="mb-2 block text-xs text-muted-foreground">
                Komentarnya gimana? (opsional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rasanya gimana? Ada menu favorit? Pelayanannya oke kagak?"
                className="h-20 text-sm"
              />
            </div>
          </div>

          {/* Status hint */}
          <p className="text-center text-xs text-muted-foreground">
            {isSolo
              ? "Langsung masuk list Udah Mampir, gaspol!"
              : partnerReviewed
              ? "Mantul! Langsung masuk list Udah Mampir"
              : `${partnerName} juga kudu review dulu baru pindah ke list Udah Mampir`
            }
          </p>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border-2 border-foreground/20 bg-destructive/30 p-3 text-sm text-foreground">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={isPending}>
              Gajadi
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Bentar...
                </span>
              ) : (
                "Simpen Review 💾"
              )}
            </Button>
          </div>
        </form>
        </>)}
        </div>
      </div>
    </dialog>
  );
}
