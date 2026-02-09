// Migration script to move existing reviews from Place to Visit model
import { db } from "../lib/db";

async function migrateVisits() {
  console.log("Starting migration of existing reviews to Visit model...");

  // Find all places with existing reviews
  const placesWithReviews = await db.place.findMany({
    where: {
      OR: [
        { hasbiRating: { not: null } },
        { nadyaRating: { not: null } },
      ],
    },
  });

  console.log(`Found ${placesWithReviews.length} places with reviews to migrate`);

  for (const place of placesWithReviews) {
    // Check if visit already exists (idempotent migration)
    const existingVisit = await db.visit.findFirst({
      where: { placeId: place.id },
    });

    if (existingVisit) {
      console.log(`Visit already exists for ${place.name}, skipping...`);
      continue;
    }

    // Create visit from legacy data
    await db.visit.create({
      data: {
        placeId: place.id,
        visitedAt: place.visitedAt || new Date(),
        photoUrl: place.photoUrl,
        visitType: place.visitType,
        hasbiRating: place.hasbiRating,
        hasbiNotes: place.hasbiNotes,
        hasbiReviewedAt: place.hasbiReviewedAt,
        nadyaRating: place.nadyaRating,
        nadyaNotes: place.nadyaNotes,
        nadyaReviewedAt: place.nadyaReviewedAt,
      },
    });

    // Update place stats
    await db.place.update({
      where: { id: place.id },
      data: {
        visitCount: 1,
        avgHasbiRating: place.hasbiRating ? place.hasbiRating : null,
        avgNadyaRating: place.nadyaRating ? place.nadyaRating : null,
        lastVisitedAt: place.visitedAt,
      },
    });

    console.log(`Migrated: ${place.name}`);
  }

  console.log("Migration complete!");
}

migrateVisits()
  .catch(console.error)
  .finally(() => db.$disconnect());
