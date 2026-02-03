import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PlaceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") as PlaceStatus | null;

  try {
    const places = await db.place.findMany({
      where: status ? { status } : undefined,
      include: { addedBy: true },
      orderBy: status === "archived"
        ? { visitedAt: "desc" }
        : { addedAt: "desc" },
    });

    return NextResponse.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}
