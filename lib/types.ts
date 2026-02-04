import type { Place, User, PlaceStatus, PlaceCategory } from "@prisma/client";

export type { Place, User, PlaceStatus, PlaceCategory };

export type PlaceWithUser = Place & {
  addedBy: User;
};

export type Username = "hasbi" | "nadya";

// Menu item with optional price
export interface MenuItem {
  name: string;
  price?: string; // e.g., "45.000 IDR"
}

// Structured restaurant info from Gemini
export interface ExtractedPlaceInfo {
  // Basic info
  name: string;
  cuisine: string;
  area: string; // e.g., "Bintaro", "Senayan"

  // Pricing
  priceRange: string; // e.g., "50-100k IDR"
  priceCategory: "budget" | "moderate" | "expensive" | "premium";

  // Menu
  signatureMenus: MenuItem[];

  // Quality indicators
  rating: number | null; // 1-5 from Google
  reviewCount: number | null;

  // Concerns & practical info
  commonComplaint: string;
  waitTime: string; // e.g., "10-15 min", "Often crowded"
  parkingInfo: string;
  operatingHours: string;

  // Metadata
  confidence: "high" | "medium" | "low";
}

export interface SessionPayload {
  authenticated: boolean;
  currentUser: Username;
  exp: number;
  [key: string]: unknown;
}
