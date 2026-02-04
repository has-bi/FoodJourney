"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { extractPlaceInfo, isValidMapsLink } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";
import type { PlaceCategory, PlaceStatus, Prisma } from "@prisma/client";

export async function addPlace(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const mapsLink = formData.get("mapsLink") as string;
  const category = formData.get("category") as PlaceCategory;
  const notes = formData.get("notes") as string | null;

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

        // Basic info
        cuisine: extracted.cuisine !== "Not available" ? extracted.cuisine : null,
        area: extracted.area !== "Not available" ? extracted.area : null,

        // Pricing
        priceRangeText: extracted.priceRange !== "Not available" ? extracted.priceRange : null,
        priceCategory: extracted.priceCategory,

        // Menu items as JSON
        signatureMenus: extracted.signatureMenus.length > 0
          ? (extracted.signatureMenus as unknown as Prisma.InputJsonValue)
          : undefined,

        // Quality indicators (ensure proper types)
        googleRating: typeof extracted.rating === "number" ? extracted.rating : null,
        reviewCount: typeof extracted.reviewCount === "number" ? extracted.reviewCount : null,

        // Practical info
        commonComplaint: extracted.commonComplaint !== "No complaints found" ? extracted.commonComplaint : null,
        waitTime: extracted.waitTime !== "Not available" ? extracted.waitTime : null,
        parkingInfo: extracted.parkingInfo !== "Not available" ? extracted.parkingInfo : null,
        operatingHours: extracted.operatingHours !== "Not available" ? extracted.operatingHours : null,

        // AI confidence
        aiConfidence: extracted.confidence,

        addedById: user.id,
        status: "suggested",
        suggestedNotes: notes || null,
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

export async function addVisitReview(
  placeId: string,
  currentUser: "hasbi" | "nadya",
  visitDate: Date,
  rating: number,
  notes: string,
  photoUrl?: string
) {
  try {
    // Get current place data
    const place = await db.place.findUnique({
      where: { id: placeId },
      select: {
        hasbiRating: true,
        nadyaRating: true,
        visitedAt: true,
        photoUrl: true,
      },
    });

    if (!place) {
      return { error: "Place not found" };
    }

    // Build user-specific review data
    const reviewData = currentUser === "hasbi"
      ? {
          hasbiRating: rating,
          hasbiNotes: notes || null,
          hasbiReviewedAt: new Date(),
        }
      : {
          nadyaRating: rating,
          nadyaNotes: notes || null,
          nadyaReviewedAt: new Date(),
        };

    // Check if this completes both reviews
    const willHaveBothReviews =
      (currentUser === "hasbi" && place.nadyaRating !== null) ||
      (currentUser === "nadya" && place.hasbiRating !== null);

    // Only update photo/visitDate if not already set (first reviewer sets these)
    const visitData: Record<string, unknown> = {};
    if (!place.visitedAt) {
      visitData.visitedAt = visitDate;
    }
    if (!place.photoUrl && photoUrl) {
      visitData.photoUrl = photoUrl;
    }

    await db.place.update({
      where: { id: placeId },
      data: {
        ...reviewData,
        ...visitData,
        // Only move to archived when both have reviewed
        ...(willHaveBothReviews ? { status: "archived" } : {}),
      },
    });

    revalidatePath("/planned");
    if (willHaveBothReviews) {
      revalidatePath("/archived");
    }
    return { success: true, completed: willHaveBothReviews };
  } catch (error) {
    console.error("Error adding visit review:", error);
    return { error: "Failed to add review" };
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
