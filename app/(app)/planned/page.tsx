"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { PlaceCard } from "@/components/PlaceCard";
import { ArchiveModal } from "@/components/ArchiveModal";
import type { PlaceWithUser, Username } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const moodFilters = [
  { value: null, label: "Semua", icon: "🍽️" },
  { value: "rainy_day", label: "Hujan", icon: "🌧️" },
  { value: "hungry_af", label: "Laper", icon: "😤" },
  { value: "comfort_food", label: "Healing", icon: "🍜" },
  { value: "birthday", label: "Ultah", icon: "🎂" },
  { value: "anniversary", label: "Anniv", icon: "💕" },
  { value: "budget", label: "Bokek", icon: "💸" },
  { value: "cheat_day", label: "Cheat", icon: "🍔" },
  { value: "quick_bite", label: "Buru", icon: "⚡" },
];

export default function PlannedPage() {
  const [places, setPlaces] = useState<PlaceWithUser[]>([]);
  const [currentUser, setCurrentUser] = useState<Username>("hasbi");
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithUser | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchData = useCallback(async () => {
    try {
      const [placesRes, userRes] = await Promise.all([
        fetch("/api/places?status=planned"),
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

  const handleArchive = (place: PlaceWithUser) => {
    setSelectedPlace(place);
  };

  const handleArchiveSuccess = () => {
    // Don't close modal here — let the success screen show first
    // Data refresh happens on close
  };

  const myReviewedCount = places.filter((place) =>
    currentUser === "hasbi"
      ? place.hasbiRating !== null
      : place.nadyaRating !== null
  ).length;

  const needsMyReviewCount = places.filter((place) => {
    const currentReviewed =
      currentUser === "hasbi"
        ? place.hasbiRating !== null
        : place.nadyaRating !== null;
    const partnerReviewed =
      currentUser === "hasbi"
        ? place.nadyaRating !== null
        : place.hasbiRating !== null;
    return partnerReviewed && !currentReviewed;
  }).length;

  // Filter places by selected mood
  const filteredPlaces = selectedMood
    ? places.filter((place) => {
        const tags = (place.tags as unknown as string[]) || [];
        return tags.includes(selectedMood);
      })
    : places;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">Mau Kesini 📋</h1>

      {/* <Link
        href="/buat-lu"
        className="flex items-center justify-between rounded-2xl border-2 border-border bg-card p-3 text-sm shadow-[0_4px_0_0_rgba(61,44,44,0.06)] transition-colors hover:bg-muted/40"
      >
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Section Baru</p>
          <p className="font-medium text-foreground">Buat lu 💌</p>
          <p className="text-xs text-muted-foreground">Pesan kilat + love voucher sekarang pindah ke sini.</p>
        </div>
        <span className="text-xs font-medium text-primary">Buka</span>
      </Link> */}

      {/* Mood Filter */}
      {places.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {moodFilters.map((filter) => (
            <button
              key={filter.value || "all"}
              onClick={() => setSelectedMood(filter.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs transition-all",
                selectedMood === filter.value
                  ? "border-foreground/40 bg-muted font-medium"
                  : "border-border hover:border-foreground/20"
              )}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      )}

      {places.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Antrian
              </p>
              <p className="mt-1 text-lg font-medium text-foreground">
                {places.length}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Udah Review
              </p>
              <p className="mt-1 text-lg font-medium text-foreground">
                {myReviewedCount}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Giliran Lu
              </p>
              <p className="mt-1 text-lg font-medium text-foreground">
                {needsMyReviewCount}
              </p>
            </div>
          </div>

          {/* Filtered results info */}
          {selectedMood && (
            <p className="text-xs text-muted-foreground">
              {filteredPlaces.length > 0
                ? `${filteredPlaces.length} tempat cocok buat mood ${moodFilters
                    .find((f) => f.value === selectedMood)
                    ?.label.toLowerCase()}`
                : "Belom ada tempat di tag ini, coba filter lain!"}
            </p>
          )}

          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              currentUser={currentUser}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Image
            src="/assets/pixel-plate.svg"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="mx-auto mb-3 h-10 w-10"
          />
          <p className="mb-2 text-muted-foreground">
            Belum ada rencana makan nih
          </p>
          <p className="text-sm text-muted-foreground/70">
            ACC dulu saran tempat biar masuk sini
          </p>
        </div>
      )}

      {selectedPlace && (
        <ArchiveModal
          place={selectedPlace}
          currentUser={currentUser}
          onClose={() => {
            setSelectedPlace(null);
            startTransition(() => {
              fetchData();
            });
          }}
          onSuccess={handleArchiveSuccess}
        />
      )}
    </div>
  );
}
