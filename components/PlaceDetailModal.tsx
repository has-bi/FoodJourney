"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import type { PlaceWithUser, Username, Visit, OrderedItem } from "@/lib/types";
import { getVisitsForPlace } from "@/app/actions/place";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getImageUrl } from "@/lib/image-url";
import { ImageViewer } from "@/components/ImageViewer";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

interface MenuItem {
  name: string;
  price?: string;
}

interface PlaceDetailModalProps {
  place: PlaceWithUser;
  currentUser?: Username;
  onClose: () => void;
  onAddReview?: () => void;
  onNewVisit?: () => void; // For "Visit Again" on archived places
}

const categoryLabels: Record<string, string> = {
  cafe: "Ngopi ☕",
  resto: "Makan 🍽️",
  sushi: "Sushi 🍣",
  fine_dining: "Mewah ✨",
  street_food: "Jajanan 🍢",
  dessert: "Manis 🍰",
};

const priceCategoryLabels: Record<string, string> = {
  budget: "Murah Meriah 💸",
  moderate: "Pas di Kantong 👍",
  expensive: "Agak Mahal 💰",
  premium: "Sultan Mode 👑",
};

export function PlaceDetailModal({ place, currentUser, onClose, onAddReview, onNewVisit }: PlaceDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const signatureMenus: MenuItem[] = (place.signatureMenus as unknown as MenuItem[]) || [];
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null);

  // Fetch visits for this place
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const visitData = await getVisitsForPlace(place.id);
        setVisits(visitData);
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setLoadingVisits(false);
      }
    };
    fetchVisits();
  }, [place.id]);

  // Check if current user can add a review to the latest pending visit
  const latestVisit = visits[0];
  const canAddReviewToVisit = currentUser && latestVisit && (
    (currentUser === "hasbi" && latestVisit.hasbiRating === null && latestVisit.nadyaRating !== null) ||
    (currentUser === "nadya" && latestVisit.nadyaRating === null && latestVisit.hasbiRating !== null)
  );

  // Check if current user can start a new visit (for planned places)
  const canStartVisit = currentUser && place.status === "planned" && (
    visits.length === 0 || (
      latestVisit && latestVisit.hasbiRating !== null && latestVisit.nadyaRating !== null
    )
  );

  // Can add review either to pending visit or start new one
  const canAddReview = canAddReviewToVisit || canStartVisit;

  // Can revisit archived places
  const canRevisit = currentUser && place.status === "archived" && onNewVisit;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full bg-transparent"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-end justify-center p-3 sm:items-center sm:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">
        {/* Header */}
        <div className="border-b-2 border-border bg-card p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-medium text-foreground">{place.name}</h3>
              {place.area && (
                <p className="mt-1 text-sm text-muted-foreground">{place.area}</p>
              )}
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="text-[11px]">
              {categoryLabels[place.category] || place.category}
            </Badge>
            {place.cuisine && (
              <Badge variant="outline" className="text-[11px] bg-muted/40">
                {place.cuisine}
              </Badge>
            )}
            {place.googleRating && (
              <Badge variant="warning" className="gap-1 text-[11px]">
                <span>★</span>
                {place.googleRating.toFixed(1)}
                {place.reviewCount && (
                  <span className="opacity-70">({place.reviewCount})</span>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] space-y-5 overflow-y-auto p-5">
          {/* Suggested Notes */}
          {place.suggestedNotes && (
            <div className="rounded-2xl border-2 border-border bg-muted p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kata {place.addedBy.displayName}
              </p>
              <p className="text-sm italic text-foreground">
                &ldquo;{place.suggestedNotes}&rdquo;
              </p>
            </div>
          )}

          {/* Price Info */}
          {place.priceRangeText && (
            <div className="rounded-2xl border-2 border-border bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Harga Sekitar
                  </p>
                  <p className="mt-1 text-lg font-medium text-foreground">
                    {place.priceRangeText}
                  </p>
                </div>
                {place.priceCategory && (
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
                  >
                    {priceCategoryLabels[place.priceCategory]}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Signature Menu */}
          {signatureMenus.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <span>🍽️</span> Menu Andalan
              </h4>
              <div className="space-y-2">
                {signatureMenus.map((menu, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border-2 border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm text-foreground">{menu.name}</span>
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
              <div className="rounded-2xl border-2 border-border bg-card p-3">
                <p className="mb-1 text-xs text-muted-foreground">🕐 Jam Buka</p>
                <p className="text-sm font-medium text-foreground">{place.operatingHours}</p>
              </div>
            )}
            {place.parkingInfo && (
              <div className="rounded-2xl border-2 border-border bg-card p-3">
                <p className="mb-1 text-xs text-muted-foreground">🅿️ Parkir</p>
                <p className="text-sm font-medium text-foreground">{place.parkingInfo}</p>
              </div>
            )}
            {place.waitTime && (
              <div className="rounded-2xl border-2 border-border bg-card p-3">
                <p className="mb-1 text-xs text-muted-foreground">⏱️ Antri</p>
                <p className="text-sm font-medium text-foreground">{place.waitTime}</p>
              </div>
            )}
          </div>

          {/* Warning/Complaint */}
          {place.commonComplaint && (
            <div className="rounded-2xl border-2 border-border bg-muted p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                ⚠️ Perlu Tau
              </p>
              <p className="text-sm text-foreground">{place.commonComplaint}</p>
            </div>
          )}

          {/* Visit History */}
          {(place.status === "archived" || place.status === "planned") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span>📍</span> Riwayat Kunjungan
                  {place.visitCount > 0 && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {place.visitCount}x kesini
                    </Badge>
                  )}
                </h4>
                {place.avgHasbiRating && place.avgNadyaRating && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {place.avgHasbiRating.toFixed(1)}★
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      {place.avgNadyaRating.toFixed(1)}★
                    </span>
                  </div>
                )}
              </div>

              {loadingVisits ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" className="text-muted-foreground" />
                </div>
              ) : visits.length > 0 ? (
                <div className="space-y-4">
                  {visits.map((visit, index) => {
                    const orderedItems: OrderedItem[] = (visit.orderedItems as unknown as OrderedItem[]) || [];
                    const isLatest = index === 0;

                    return (
                      <div
                        key={visit.id}
                        className={`rounded-2xl border-2 ${isLatest ? "border-accent/50" : "border-border"} bg-card p-4`}
                      >
                        {/* Visit Header */}
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {visit.visitType === "solo" ? "🚶" : "👫"}
                            </span>
                            <span className="text-sm font-medium">
                              {new Date(visit.visitedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {isLatest && (
                              <Badge variant="success" className="text-[10px]">
                                Terbaru
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Photos from both users */}
                        {(() => {
                          const hasbiPhotos = toStringArray(visit.hasbiPhotos);
                          const nadyaPhotos = toStringArray(visit.nadyaPhotos);
                          // Legacy: single photoUrl field
                          const legacyPhotos = (!hasbiPhotos.length && !nadyaPhotos.length && visit.photoUrl) ? [visit.photoUrl] : [];
                          const allPhotos = [
                            ...hasbiPhotos.map((url) => ({ url, user: "Hasbi" as const })),
                            ...nadyaPhotos.map((url) => ({ url, user: "Nadya" as const })),
                            ...legacyPhotos.map((url) => ({ url, user: null })),
                          ];
                          if (allPhotos.length === 0) return null;
                          const showLabel = hasbiPhotos.length > 0 && nadyaPhotos.length > 0;
                          return (
                            <div className={`mb-3 grid gap-2 ${allPhotos.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                              {allPhotos.map((photo, pi) => (
                                <button
                                  key={pi}
                                  type="button"
                                  onClick={() => setViewingImage({
                                    src: getImageUrl(photo.url),
                                    alt: `Foto ${place.name}${photo.user ? ` - ${photo.user}` : ""}`,
                                  })}
                                  className="relative w-full cursor-pointer overflow-hidden rounded-xl"
                                >
                                  <Image
                                    src={getImageUrl(photo.url)}
                                    alt={photo.user ? `Foto ${photo.user}` : "Foto kunjungan"}
                                    width={400}
                                    height={256}
                                    unoptimized
                                    className="aspect-square w-full rounded-xl object-cover transition-transform hover:scale-105"
                                  />
                                  {showLabel && photo.user && (
                                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                                      <span className={`h-1.5 w-1.5 rounded-full ${photo.user === "Hasbi" ? "bg-primary" : "bg-secondary"}`} />
                                      {photo.user}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Ordered Items */}
                        {orderedItems.length > 0 && (
                          <div className="mb-3">
                            <p className="mb-2 text-xs text-muted-foreground">Pesen:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {orderedItems.map((item, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[11px] bg-muted/40"
                                  title={item.notes || undefined}
                                >
                                  {item.name}
                                  {item.notes && " 💬"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reviews */}
                        <div className="space-y-2">
                          {/* Hasbi's Review */}
                          {visit.hasbiRating && (
                            <div className="rounded-xl bg-muted/50 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                <span className="text-xs font-medium text-primary">Hasbi</span>
                                <span className="ml-auto text-xs text-foreground">
                                  {"★".repeat(visit.hasbiRating)}
                                </span>
                              </div>
                              {visit.hasbiNotes && (
                                <p className="mt-1 text-xs text-foreground/70">{visit.hasbiNotes}</p>
                              )}
                            </div>
                          )}

                          {/* Nadya's Review */}
                          {visit.nadyaRating && (
                            <div className="rounded-xl bg-muted/50 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-secondary" />
                                <span className="text-xs font-medium text-secondary">Nadya</span>
                                <span className="ml-auto text-xs text-foreground">
                                  {"★".repeat(visit.nadyaRating)}
                                </span>
                              </div>
                              {visit.nadyaNotes && (
                                <p className="mt-1 text-xs text-foreground/70">{visit.nadyaNotes}</p>
                              )}
                            </div>
                          )}

                          {/* Pending review hint */}
                          {visit.visitType === "together" && (!visit.hasbiRating || !visit.nadyaRating) && (
                            <p className="text-center text-xs text-muted-foreground">
                              Nunggu {!visit.hasbiRating ? "Hasbi" : "Nadya"} review
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Belom pernah kesini, yuk gas cobain! 🍽️
                </p>
              )}
            </div>
          )}

          {/* AI Confidence */}
          {place.aiConfidence && place.aiConfidence !== "high" && (
            <p className="text-center text-xs text-muted-foreground">
              Infonya mungkin belom lengkap, cek langsung di Google Maps ya
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card p-4">
          {/* Add Review Button (for pending visit or new visit on planned) */}
          {canAddReview && onAddReview && (
            <Button
              onClick={onAddReview}
              size="sm"
              variant={currentUser === "hasbi" ? "default" : "secondary"}
              className="mb-3 w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {canAddReviewToVisit ? "Giliran Gue Review! 📝" : "Udah Mampir Nih! ✅"}
            </Button>
          )}

          {/* Visit Again Button (for archived places) */}
          {canRevisit && (
            <Button
              onClick={onNewVisit}
              size="sm"
              variant="outline"
              className="mb-3 w-full gap-2"
            >
              <span>🔄</span>
              Gas Kesini Lagi!
            </Button>
          )}

          <div className="flex gap-2">
            <a
              href={place.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "sm", className: "flex-1 gap-2" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Buka GMaps
            </a>
            <Button onClick={onClose} variant="ghost" size="sm">
              Tutup
            </Button>
          </div>

          {/* Added by */}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Diusulin sama{" "}
            <span className={place.addedBy.username === "hasbi" ? "text-primary" : "text-secondary"}>
              {place.addedBy.displayName}
            </span>
            {place.lastVisitedAt && (
              <span> · Terakhir nongol {new Date(place.lastVisitedAt).toLocaleDateString("id-ID")}</span>
            )}
          </p>
        </div>
        </div>
      </div>

      {viewingImage && (
        <ImageViewer
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}
    </dialog>
  );
}
