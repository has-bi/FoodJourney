"use client";

import { useEffect, useState, useTransition } from "react";
import { PlaceCard } from "@/components/PlaceCard";
import { ArchiveModal } from "@/components/ArchiveModal";
import type { PlaceWithUser, Username } from "@/lib/types";

export default function PlannedPage() {
  const [places, setPlaces] = useState<PlaceWithUser[]>([]);
  const [currentUser, setCurrentUser] = useState<Username>("hasbi");
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, []);

  const handleArchive = (place: PlaceWithUser) => {
    setSelectedPlace(place);
  };

  const handleArchiveSuccess = () => {
    setSelectedPlace(null);
    // Refresh the list
    startTransition(() => {
      fetch("/api/places?status=planned")
        .then((res) => res.json())
        .then((data) => setPlaces(data));
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Planned Places</h1>

      {places.length > 0 ? (
        <div className="space-y-3">
          {places.map((place) => (
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
          <p className="text-base-content/60 mb-2">No planned places yet</p>
          <p className="text-sm text-base-content/40">
            Approve suggestions to add them here
          </p>
        </div>
      )}

      {selectedPlace && (
        <ArchiveModal
          place={selectedPlace}
          currentUser={currentUser}
          onClose={() => setSelectedPlace(null)}
          onSuccess={handleArchiveSuccess}
        />
      )}
    </div>
  );
}
