import { getPlacesByStatus } from "@/app/actions/place";
import { getCurrentUser } from "@/lib/auth";
import { PlaceCard } from "@/components/PlaceCard";
import { redirect } from "next/navigation";
import type { PlaceWithUser } from "@/lib/types";

export default async function SuggestedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const places = (await getPlacesByStatus("suggested")) as PlaceWithUser[];

  // Separate places that need current user's approval
  const needsMyApproval = places.filter((place) => {
    if (currentUser === "hasbi") return !place.hasbiApproved;
    return !place.nadyaApproved;
  });

  const waitingForPartner = places.filter((place) => {
    if (currentUser === "hasbi") return place.hasbiApproved;
    return place.nadyaApproved;
  });

  return (
    <div className="space-y-6">
      {needsMyApproval.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Needs Your Approval</h2>
          <div className="space-y-3">
            {needsMyApproval.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                currentUser={currentUser}
                showActions
              />
            ))}
          </div>
        </section>
      )}

      {waitingForPartner.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-base-content/70">
            Waiting for Partner
          </h2>
          <div className="space-y-3">
            {waitingForPartner.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                currentUser={currentUser}
              />
            ))}
          </div>
        </section>
      )}

      {places.length === 0 && (
        <div className="text-center py-12">
          <p className="text-base-content/60 mb-2">No suggestions yet</p>
          <p className="text-sm text-base-content/40">
            Tap the + button to add a new place
          </p>
        </div>
      )}
    </div>
  );
}
