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
    <div className="min-h-screen bg-base-200 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-base-100 border-b border-base-300">
        <div className="navbar px-4">
          <div className="flex-1">
            <span className="text-lg font-bold">FoodJourney</span>
          </div>
          <div className="flex-none">
            <UserSelector currentUser={currentUser} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">{children}</main>

      {/* Add Place FAB */}
      <AddPlaceModal />

      {/* Bottom Navigation */}
      <TabNavigation pendingCount={pendingCount} />
    </div>
  );
}
