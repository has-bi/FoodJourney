"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { extractPlaceInfo, isValidMapsLink } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";
import type { PlaceCategory, PriceRange, PlaceStatus } from "@prisma/client";

function mapPriceRange(price: string): PriceRange | null {
  const mapping: Record<string, PriceRange> = {
    "$": "cheap",
    "$$": "moderate",
    "$$$": "expensive",
    "$$$$": "luxury",
  };
  return mapping[price] || null;
}

export async function addPlace(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const mapsLink = formData.get("mapsLink") as string;
  const category = formData.get("category") as PlaceCategory;

  if (!mapsLink) {
    return { error: "Maps link is required" };
  }

  if (!isValidMapsLink(mapsLink)) {
    return { error: "Please enter a valid Google Maps link" };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Not authenticated" };
  }

  // Get user ID
  const user = await db.user.findUnique({
    where: { username: currentUser },
  });

  if (!user) {
    return { error: "User not found" };
  }

  try {
    // Extract info from Gemini
    const extracted = await extractPlaceInfo(mapsLink);

    // Auto-approve for submitter
    const approval = {
      hasbiApproved: currentUser === "hasbi",
      nadyaApproved: currentUser === "nadya",
    };

    await db.place.create({
      data: {
        name: extracted.name,
        mapsLink,
        category,
        cuisine: extracted.cuisine !== "N/A" ? extracted.cuisine : null,
        priceRange: mapPriceRange(extracted.priceRange),
        topMenus: extracted.topMenus,
        worstReview: extracted.worstReview !== "N/A" ? extracted.worstReview : null,
        addedById: user.id,
        status: "suggested",
        ...approval,
      },
    });

    revalidatePath("/suggested");
    return { success: true };
  } catch (error) {
    console.error("Error adding place:", error);
    return { error: "Failed to add place. Please try again." };
  }
}

export async function approvePlace(placeId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Not authenticated" };
  }

  try {
    const field = currentUser === "hasbi" ? "hasbiApproved" : "nadyaApproved";

    await db.place.update({
      where: { id: placeId },
      data: { [field]: true },
    });

    // Check if both approved
    const place = await db.place.findUnique({
      where: { id: placeId },
      select: { hasbiApproved: true, nadyaApproved: true },
    });

    if (place?.hasbiApproved && place?.nadyaApproved) {
      await db.place.update({
        where: { id: placeId },
        data: { status: "planned" },
      });
      revalidatePath("/planned");
    }

    revalidatePath("/suggested");
    return { success: true };
  } catch (error) {
    console.error("Error approving place:", error);
    return { error: "Failed to approve place" };
  }
}

export async function skipPlace(placeId: string) {
  try {
    await db.place.update({
      where: { id: placeId },
      data: { status: "skipped" },
    });

    revalidatePath("/suggested");
    return { success: true };
  } catch (error) {
    console.error("Error skipping place:", error);
    return { error: "Failed to skip place" };
  }
}

export async function archivePlace(
  placeId: string,
  visitDate: Date,
  rating: number,
  notes: string,
  photoUrl?: string
) {
  try {
    await db.place.update({
      where: { id: placeId },
      data: {
        status: "archived",
        visitedAt: visitDate,
        rating,
        notes: notes || null,
        photoUrl: photoUrl || null,
      },
    });

    revalidatePath("/planned");
    revalidatePath("/archived");
    return { success: true };
  } catch (error) {
    console.error("Error archiving place:", error);
    return { error: "Failed to archive place" };
  }
}

export async function getPlacesByStatus(status: PlaceStatus) {
  const places = await db.place.findMany({
    where: { status },
    include: { addedBy: true },
    orderBy: { addedAt: "desc" },
  });
  return places;
}

export async function getPlaceById(id: string) {
  const place = await db.place.findUnique({
    where: { id },
    include: { addedBy: true },
  });
  return place;
}
