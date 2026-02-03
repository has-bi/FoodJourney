import type { Place, User, PlaceStatus, PlaceCategory, PriceRange } from "@prisma/client";

export type { Place, User, PlaceStatus, PlaceCategory, PriceRange };

export type PlaceWithUser = Place & {
  addedBy: User;
};

export type Username = "hasbi" | "nadya";

export interface ExtractedPlaceInfo {
  name: string;
  cuisine: string;
  priceRange: string;
  topMenus: string[];
  worstReview: string;
}

export interface SessionPayload {
  authenticated: boolean;
  currentUser: Username;
  exp: number;
  [key: string]: unknown;
}
