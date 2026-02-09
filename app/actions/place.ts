"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { extractPlaceInfo, isValidMapsLink } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";
import type { PlaceCategory, PlaceStatus, VisitType, Prisma } from "@prisma/client";
import { uploadImage } from "@/lib/r2";

export async function addPlace(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const mapsLink = formData.get("mapsLink") as string;
  const category = formData.get("category") as PlaceCategory;
  const notes = formData.get("notes") as string | null;
  const visitType = (formData.get("visitType") as VisitType) || "together";
  const tagsJson = formData.get("tags") as string | null;
  const tags = tagsJson ? JSON.parse(tagsJson) : [];

  if (!mapsLink) {
    return { error: "Link Maps wajib diisi, cuy" };
  }

  if (!isValidMapsLink(mapsLink)) {
    return { error: "Link Google Maps-nya kagak valid, cek lagi ya" };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi lu abis, login lagi ya" };
  }

  // Get user ID
  const user = await db.user.findUnique({
    where: { username: currentUser },
  });

  if (!user) {
    return { error: "Akun lu kagak ketemu" };
  }

  try {
    // Extract info from Gemini
    const extracted = await extractPlaceInfo(mapsLink);

    // For solo visits: auto-approve both and go straight to planned
    // For together visits: submitter auto-approves, partner needs to accept
    const isSolo = visitType === "solo";
    const approval = isSolo
      ? { hasbiApproved: true, nadyaApproved: true }
      : {
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
        // Solo goes straight to planned, together needs approval
        status: isSolo ? "planned" : "suggested",
        suggestedNotes: notes || null,

        // Visit type and invite status
        visitType,
        inviteStatus: isSolo ? null : "pending",

        // Occasion tags
        tags: tags.length > 0 ? (tags as Prisma.InputJsonValue) : undefined,

        ...approval,
      },
    });

    revalidatePath("/suggested");
    if (isSolo) {
      revalidatePath("/planned");
    }
    return { success: true };
  } catch (error) {
    console.error("Error adding place:", error);
    return { error: "Gagal nambahin tempat, coba lagi bentar" };
  }
}

export async function approvePlace(placeId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi lu abis, login lagi ya" };
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
      select: { hasbiApproved: true, nadyaApproved: true, visitType: true },
    });

    if (place?.hasbiApproved && place?.nadyaApproved) {
      await db.place.update({
        where: { id: placeId },
        data: {
          status: "planned",
          // Update invite status to accepted for together visits
          ...(place.visitType === "together" ? { inviteStatus: "accepted" } : {}),
        },
      });
      revalidatePath("/planned");
    }

    revalidatePath("/suggested");
    return { success: true };
  } catch (error) {
    console.error("Error approving place:", error);
    return { error: "Gagal ACC tempat, coba lagi" };
  }
}

export async function declineInvite(placeId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi lu abis, login lagi ya" };
  }

  try {
    await db.place.update({
      where: { id: placeId },
      data: {
        inviteStatus: "declined",
        status: "skipped",
      },
    });

    revalidatePath("/suggested");
    return { success: true };
  } catch (error) {
    console.error("Error declining invite:", error);
    return { error: "Gagal nolak ajakan, ulang lagi" };
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
    return { error: "Gagal skip tempat, coba lagi" };
  }
}

interface OrderedItem {
  name: string;
  notes?: string;
}

export async function addVisitReview(
  placeId: string,
  currentUser: "hasbi" | "nadya",
  visitDate: Date,
  rating: number,
  notes: string,
  photoUrl?: string,
  orderedItems?: OrderedItem[],
  existingVisitId?: string // If adding review to existing visit
) {
  try {
    // Get current place data with latest visit
    const place = await db.place.findUnique({
      where: { id: placeId },
      include: {
        visits: {
          orderBy: { visitedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!place) {
      return { error: "Tempatnya kagak ketemu" };
    }

    const isSolo = place.visitType === "solo";
    const latestVisit = place.visits[0];

    // Check if we're adding a review to existing visit or creating new one
    // A visit is "in progress" if it exists, has a date set, but current user hasn't reviewed yet
    const existingInProgressVisit = latestVisit && (
      (currentUser === "hasbi" && latestVisit.hasbiRating === null && latestVisit.nadyaRating !== null) ||
      (currentUser === "nadya" && latestVisit.nadyaRating === null && latestVisit.hasbiRating !== null)
    );

    const visitId = existingVisitId || (existingInProgressVisit ? latestVisit.id : null);

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

    if (visitId) {
      // Adding review to existing visit
      const visit = await db.visit.findUnique({
        where: { id: visitId },
      });

      if (!visit) {
        return { error: "Data mampirnya kagak ketemu" };
      }

      // For together visits: complete after both reviews
      const willBeComplete = isSolo
        ? true
        : (currentUser === "hasbi" && visit.nadyaRating !== null) ||
          (currentUser === "nadya" && visit.hasbiRating !== null);

      // Update visit with new review
      const existingItems = (visit.orderedItems as unknown as OrderedItem[]) || [];
      const mergedItems = orderedItems && orderedItems.length > 0
        ? [...existingItems, ...orderedItems]
        : undefined;

      await db.visit.update({
        where: { id: visitId },
        data: {
          ...reviewData,
          // Merge ordered items if provided
          ...(mergedItems ? {
            orderedItems: mergedItems as unknown as Prisma.InputJsonValue,
          } : {}),
        },
      });

      // Update place stats if complete
      if (willBeComplete) {
        await updatePlaceStats(placeId);
        await db.place.update({
          where: { id: placeId },
          data: { status: "archived" },
        });
      }

      revalidatePath("/planned");
      if (willBeComplete) {
        revalidatePath("/archived");
      }
      return { success: true, completed: willBeComplete, visitId };
    } else {
      // Upload photo to R2 if provided as base64
      let uploadedPhotoUrl: string | null = null;
      if (photoUrl && photoUrl.startsWith("data:")) {
        uploadedPhotoUrl = await uploadImage(photoUrl, `visits/${placeId}`);
      } else if (photoUrl) {
        uploadedPhotoUrl = photoUrl;
      }

      // Creating new visit
      const newVisit = await db.visit.create({
        data: {
          placeId,
          visitedAt: visitDate,
          photoUrl: uploadedPhotoUrl,
          visitType: place.visitType,
          orderedItems: orderedItems && orderedItems.length > 0
            ? (orderedItems as unknown as Prisma.InputJsonValue)
            : undefined,
          ...reviewData,
        },
      });

      // For solo visits: complete immediately
      // For together visits: wait for both reviews
      const willBeComplete = isSolo;

      // Update place stats
      await updatePlaceStats(placeId);

      // Update place status
      if (willBeComplete) {
        await db.place.update({
          where: { id: placeId },
          data: { status: "archived" },
        });
      }

      revalidatePath("/planned");
      if (willBeComplete) {
        revalidatePath("/archived");
      }
      return { success: true, completed: willBeComplete, visitId: newVisit.id };
    }
  } catch (error) {
    console.error("Error adding visit review:", error);
    return { error: "Gagal simpen review, coba lagi" };
  }
}

// Helper to recalculate place stats from visits
async function updatePlaceStats(placeId: string) {
  const visits = await db.visit.findMany({
    where: { placeId },
    orderBy: { visitedAt: "desc" },
  });

  const completedVisits = visits.filter(
    (v) => v.hasbiRating !== null || v.nadyaRating !== null
  );

  const hasbiRatings = visits
    .filter((v) => v.hasbiRating !== null)
    .map((v) => v.hasbiRating as number);

  const nadyaRatings = visits
    .filter((v) => v.nadyaRating !== null)
    .map((v) => v.nadyaRating as number);

  const avgHasbi = hasbiRatings.length > 0
    ? hasbiRatings.reduce((a, b) => a + b, 0) / hasbiRatings.length
    : null;

  const avgNadya = nadyaRatings.length > 0
    ? nadyaRatings.reduce((a, b) => a + b, 0) / nadyaRatings.length
    : null;

  await db.place.update({
    where: { id: placeId },
    data: {
      visitCount: completedVisits.length,
      avgHasbiRating: avgHasbi,
      avgNadyaRating: avgNadya,
      lastVisitedAt: visits[0]?.visitedAt || null,
    },
  });
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

export async function getPlaceWithVisits(id: string) {
  const place = await db.place.findUnique({
    where: { id },
    include: {
      addedBy: true,
      visits: {
        orderBy: { visitedAt: "desc" },
      },
    },
  });
  return place;
}

export async function getVisitsForPlace(placeId: string) {
  const visits = await db.visit.findMany({
    where: { placeId },
    orderBy: { visitedAt: "desc" },
  });
  return visits;
}

// Toggle content created status (Hasbi only)
export async function toggleContentCreated(placeId: string) {
  const currentUser = await getCurrentUser();

  if (currentUser !== "hasbi") {
    return { error: "Yang boleh centang konten cuma Hasbi, bro" };
  }

  try {
    const place = await db.place.findUnique({
      where: { id: placeId },
      select: { hasbiContentCreated: true },
    });

    if (!place) {
      return { error: "Tempatnya kagak ketemu" };
    }

    await db.place.update({
      where: { id: placeId },
      data: {
        hasbiContentCreated: !place.hasbiContentCreated,
      },
    });

    revalidatePath("/archived");
    return { success: true, contentCreated: !place.hasbiContentCreated };
  } catch (error) {
    console.error("Error toggling content status:", error);
    return { error: "Gagal update status konten" };
  }
}

// Create a new visit (for revisiting a place)
export async function createNewVisit(
  placeId: string,
  currentUser: "hasbi" | "nadya",
  visitDate: Date,
  rating: number,
  notes: string,
  photoUrl?: string,
  orderedItems?: OrderedItem[]
) {
  try {
    const place = await db.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      return { error: "Tempatnya kagak ketemu" };
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

    const isSolo = place.visitType === "solo";

    // Upload photo to R2 if provided as base64
    let uploadedPhotoUrl: string | null = null;
    if (photoUrl && photoUrl.startsWith("data:")) {
      uploadedPhotoUrl = await uploadImage(photoUrl, `visits/${placeId}`);
    } else if (photoUrl) {
      uploadedPhotoUrl = photoUrl;
    }

    const newVisit = await db.visit.create({
      data: {
        placeId,
        visitedAt: visitDate,
        photoUrl: uploadedPhotoUrl,
        visitType: place.visitType,
        orderedItems: orderedItems && orderedItems.length > 0
          ? (orderedItems as unknown as Prisma.InputJsonValue)
          : undefined,
        ...reviewData,
      },
    });

    // Update place stats
    await updatePlaceStats(placeId);

    // Keep place as archived (it's already been visited)
    revalidatePath("/archived");
    return { success: true, visitId: newVisit.id, completed: isSolo };
  } catch (error) {
    console.error("Error creating new visit:", error);
    return { error: "Gagal bikin catetan mampir baru" };
  }
}
