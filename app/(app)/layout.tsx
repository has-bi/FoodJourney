import { TabNavigation } from "@/components/TabNavigation";
import { UserSelector } from "@/components/UserSelector";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

async function getPendingCount(currentUser: string) {
  const count = await db.place.count({
    where: {
      status: "suggested",
      [currentUser === "hasbi" ? "hasbiApproved" : "nadyaApproved"]: false,
    },
  });
  return count;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const pendingCount = await getPendingCount(currentUser);

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-base-100/95 backdrop-blur-sm border-b border-base-200">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-bold text-base-content">FoodJourney</span>
          </div>
          <UserSelector currentUser={currentUser} />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">{children}</main>

      {/* Add Place FAB */}
      <AddPlaceModal />

      {/* Bottom Navigation */}
      <TabNavigation pendingCount={pendingCount} />
    </div>
  );
}
