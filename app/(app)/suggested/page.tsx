import { getPlacesByStatus } from "@/app/actions/place";
import { getCurrentUser } from "@/lib/auth";
import { PlaceCard } from "@/components/PlaceCard";
import { redirect } from "next/navigation";
import type { PlaceWithUser } from "@/lib/types";
import { db } from "@/lib/db";
import Image from "next/image";

export default async function SuggestedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const places = (await getPlacesByStatus("suggested")) as PlaceWithUser[];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [visitedTotal, visitedThisMonth, plannedTotal, suggestedTotal] = await Promise.all([
    db.place.count({ where: { status: "archived" } }),
    db.place.count({
      where: {
        status: "archived",
        visitedAt: { gte: startOfMonth },
      },
    }),
    db.place.count({ where: { status: "planned" } }),
    db.place.count({ where: { status: "suggested" } }),
  ]);

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
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Rangkuman</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Udah Mampir</p>
            <p className="mt-1 text-lg font-medium text-foreground">{visitedTotal}</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bulan Ini</p>
            <p className="mt-1 text-lg font-medium text-foreground">{visitedThisMonth}</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Direncanain</p>
            <p className="mt-1 text-lg font-medium text-foreground">{plannedTotal}</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_rgba(61,44,44,0.06)]">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nunggu ACC</p>
            <p className="mt-1 text-lg font-medium text-foreground">{suggestedTotal}</p>
          </div>
        </div>
      </section>
      {needsMyApproval.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Butuh ACC Lu 👆</h2>
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
          <h2 className="mb-3 text-lg font-medium text-muted-foreground">
            Nunggu Dia ACC
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
          <Image src="/assets/pixel-plate.svg" alt="" aria-hidden="true" width={40} height={40} className="mx-auto mb-3 h-10 w-10" />
          <p className="mb-2 text-muted-foreground">Belum ada saran tempat nih</p>
          <p className="text-sm text-muted-foreground/70">
            Pencet tombol + buat nambahin tempat baru
          </p>
        </div>
      )}
    </div>
  );
}
