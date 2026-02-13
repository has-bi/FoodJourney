"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Image from "next/image";
import type { PlaceWithUser, Username } from "@/lib/types";
import { toggleContentCreated } from "@/app/actions/place";
import { Spinner } from "@/components/ui/spinner";
import { ArchiveModal } from "@/components/ArchiveModal";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/image-url";

const priceCategoryLabels: Record<string, string> = {
  budget: "$",
  moderate: "$$",
  expensive: "$$$",
  premium: "$$$$",
};

export default function ArchivedPage() {
  const [places, setPlaces] = useState<PlaceWithUser[]>([]);
  const [currentUser, setCurrentUser] = useState<Username>("hasbi");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRevisitModal, setShowRevisitModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [placesRes, userRes] = await Promise.all([
        fetch("/api/places?status=archived"),
        fetch("/api/user"),
      ]);

      if (placesRes.ok) {
        const data = await placesRes.json();
        setPlaces(data);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.username);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlaceClick = (place: PlaceWithUser) => {
    setSelectedPlace(place);
    setShowDetailModal(true);
  };

  const handleRevisit = () => {
    setShowDetailModal(false);
    setShowRevisitModal(true);
  };

  const handleRevisitSuccess = () => {
    // Don't close modal here — let the success screen show first
    // Data refresh happens on close
  };

  const [, startTransition] = useTransition();

  const handleToggleContent = async (e: React.MouseEvent, placeId: string) => {
    e.stopPropagation(); // Prevent card click
    startTransition(async () => {
      const result = await toggleContentCreated(placeId);
      if (result.success) {
        // Update local state
        setPlaces((prev) =>
          prev.map((p) =>
            p.id === placeId ? { ...p, hasbiContentCreated: result.contentCreated } : p
          )
        );
      }
    });
  };

  const withPhotos = places.filter((place) => place.photoUrl).length;
  const totalVisits = places.reduce((sum, place) => sum + (place.visitCount || 0), 0);
  const contentCreatedCount = places.filter((place) => place.hasbiContentCreated).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">Udah Mampir 🏆</h1>

      {places.length > 0 ? (
        <>
          <div className={`grid gap-3 ${currentUser === "hasbi" ? "grid-cols-4" : "grid-cols-3"}`}>
            <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tempat</p>
              <p className="mt-1 text-lg font-medium text-foreground">{places.length}</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Kunjungan</p>
              <p className="mt-1 text-lg font-medium text-foreground">{totalVisits}</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Foto</p>
              <p className="mt-1 text-lg font-medium text-foreground">{withPhotos}</p>
            </div>
            {/* Content tracker - Hasbi only */}
            {currentUser === "hasbi" && (
              <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">📹 Konten</p>
                <p className="mt-1 text-lg font-medium text-foreground">{contentCreatedCount}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {places.map((place) => (
              <div
                key={place.id}
                onClick={() => handlePlaceClick(place)}
                className="card-clickable cursor-pointer overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_rgba(61,44,44,0.08)]"
              >
                {place.photoUrl ? (
                  <figure className="relative aspect-square">
                    <Image
                      src={getImageUrl(place.photoUrl)}
                      alt={place.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover"
                    />
                  </figure>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted/70">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-medium text-sm line-clamp-1 text-foreground">
                      {place.name}
                    </h3>
                    {(place.visitCount || 0) > 1 && (
                      <Badge variant="success" className="shrink-0 text-[9px]">
                        {place.visitCount}x
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      {place.avgHasbiRating && (
                        <span className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-foreground">{place.avgHasbiRating.toFixed(1)}★</span>
                        </span>
                      )}
                      {place.avgNadyaRating && (
                        <span className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                          <span className="text-foreground">{place.avgNadyaRating.toFixed(1)}★</span>
                        </span>
                      )}
                      {!place.avgHasbiRating && !place.avgNadyaRating && (
                        <span>Belom ada rating</span>
                      )}
                    </div>
                    {place.priceCategory && (
                      <span>{priceCategoryLabels[place.priceCategory]}</span>
                    )}
                  </div>
                  {place.lastVisitedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(place.lastVisitedAt).toLocaleDateString("id-ID")}
                    </p>
                  )}

                  {/* Content checkbox - Hasbi only */}
                  {currentUser === "hasbi" && (
                    <div
                      onClick={(e) => handleToggleContent(e, place.id)}
                      className={`mt-2 flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 text-xs cursor-pointer transition-all ${
                        place.hasbiContentCreated
                          ? "border-success/50 bg-success/10 text-success"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <span className={`h-4 w-4 flex items-center justify-center rounded border-2 ${
                        place.hasbiContentCreated
                          ? "border-success bg-success text-white"
                          : "border-muted-foreground/40"
                      }`}>
                        {place.hasbiContentCreated && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span>{place.hasbiContentCreated ? "Udah dikontenin! 🎬" : "Belom dikontenin"}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Image src="/assets/pixel-plate.svg" alt="" aria-hidden="true" width={40} height={40} className="mx-auto mb-3 h-10 w-10" />
          <p className="mb-2 text-muted-foreground">Belum pernah mampir ke mana-mana</p>
          <p className="text-sm text-muted-foreground/70">
            Gaskeun dulu makan, ntar review di sini
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPlace && showDetailModal && (
        <PlaceDetailModal
          place={selectedPlace}
          currentUser={currentUser}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPlace(null);
          }}
          onNewVisit={handleRevisit}
        />
      )}

      {/* Revisit Modal */}
      {selectedPlace && showRevisitModal && (
        <ArchiveModal
          place={selectedPlace}
          currentUser={currentUser}
          onClose={() => {
            setShowRevisitModal(false);
            setSelectedPlace(null);
            fetchData();
          }}
          onSuccess={handleRevisitSuccess}
          isNewVisit={true}
        />
      )}
    </div>
  );
}
