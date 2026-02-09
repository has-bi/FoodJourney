import { TabNavigation } from "@/components/TabNavigation";
import { UserSelector } from "@/components/UserSelector";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Image from "next/image";

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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/pixel-plate.svg"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="font-medium text-foreground">TekCobainYuk</span>
          </div>
          <UserSelector currentUser={currentUser} />
        </div>
        <div className="h-1 w-full bg-linear-to-r from-primary/50 via-accent/40 to-secondary/50" />
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">{children}</main>

      {/* Add Place FAB */}
      <AddPlaceModal currentUser={currentUser} />

      {/* Bottom Navigation */}
      <TabNavigation pendingCount={pendingCount} />
    </div>
  );
}
