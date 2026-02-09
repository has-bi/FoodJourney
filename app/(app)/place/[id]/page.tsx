import { getPlaceById } from "@/app/actions/place";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-url";

const priceCategoryLabels: Record<string, string> = {
  budget: "Murah Meriah",
  moderate: "Pas di Kantong",
  expensive: "Agak Mahal",
  premium: "Sultan Mode",
};

const categoryLabels: Record<string, string> = {
  cafe: "Ngopi",
  resto: "Makan",
  sushi: "Sushi",
  fine_dining: "Mewah",
  street_food: "Kaki Lima",
  dessert: "Manis",
};

interface MenuItem {
  name: string;
  price?: string;
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await getPlaceById(id);

  if (!place) {
    notFound();
  }

  const signatureMenus: MenuItem[] = (place.signatureMenus as unknown as MenuItem[]) || [];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link href="/archived" className={buttonClasses({ variant: "ghost", size: "sm", className: "gap-2" })}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Balik
      </Link>

      {/* Photo */}
      {place.photoUrl ? (
        <figure className="relative overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_rgba(61,44,44,0.08)] aspect-video">
          <Image
            src={getImageUrl(place.photoUrl)}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </figure>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-3xl border-2 border-border bg-muted/70 shadow-[0_6px_0_0_rgba(61,44,44,0.08)]">
          <span className="text-6xl">🍽️</span>
        </div>
      )}

      {/* Info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{place.name}</h1>
          {place.area && (
            <p className="mt-1 text-sm text-muted-foreground">{place.area}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge>
              {categoryLabels[place.category] || place.category}
            </Badge>
            {place.cuisine && (
              <Badge variant="outline" className="bg-muted/40">
                {place.cuisine}
              </Badge>
            )}
            {place.googleRating && (
              <Badge variant="warning" className="gap-1">
                ★ {place.googleRating.toFixed(1)}
                {place.reviewCount && (
                  <span className="opacity-70">({place.reviewCount})</span>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Price Info */}
        {place.priceRangeText && (
          <div className="rounded-2xl border-2 border-border bg-muted p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Kisaran Harga
                </p>
                <p className="mt-1 text-lg font-medium text-foreground">
                  {place.priceRangeText}
                </p>
              </div>
              {place.priceCategory && (
                <Badge
                  variant={
                    place.priceCategory === "budget"
                      ? "success"
                      : place.priceCategory === "moderate"
                      ? "info"
                      : place.priceCategory === "expensive"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {priceCategoryLabels[place.priceCategory]}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Visit date */}
        {place.visitedAt && (
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Tanggal Mampir</p>
              <p className="font-medium text-foreground">
                {new Date(place.visitedAt).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* User Reviews */}
        {(place.hasbiRating || place.nadyaRating) && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Ulasan</p>

            {/* Hasbi's Review */}
            {place.hasbiRating && (
              <div className="rounded-2xl border-2 border-border bg-transparent p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-primary">Hasbi</span>
                  <span className="ml-auto text-lg text-foreground">
                    {"★".repeat(place.hasbiRating)}
                    {"☆".repeat(5 - place.hasbiRating)}
                  </span>
                </div>
                {place.hasbiNotes && (
                  <p className="text-sm text-foreground/80">{place.hasbiNotes}</p>
                )}
              </div>
            )}

            {/* Nadya's Review */}
            {place.nadyaRating && (
              <div className="rounded-2xl border-2 border-border bg-transparent p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                  <span className="text-sm font-medium text-secondary">Nadya</span>
                  <span className="ml-auto text-lg text-foreground">
                    {"★".repeat(place.nadyaRating)}
                    {"☆".repeat(5 - place.nadyaRating)}
                  </span>
                </div>
                {place.nadyaNotes && (
                  <p className="text-sm text-foreground/80">{place.nadyaNotes}</p>
                )}
              </div>
            )}

            {/* Missing review hint */}
            {(!place.hasbiRating || !place.nadyaRating) && (
              <p className="text-center text-xs text-muted-foreground">
                {!place.hasbiRating ? "Hasbi" : "Nadya"} belom ngereview
              </p>
            )}
          </div>
        )}

        {/* Signature Menu */}
        {signatureMenus.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Menu Andalan</p>
            <div className="space-y-2">
              {signatureMenus.map((menu, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl border-2 border-border bg-card px-3 py-2"
                >
                  <span className="text-sm text-foreground">{menu.name}</span>
                  {menu.price && (
                    <span className="text-sm font-medium text-primary">
                      Rp {menu.price}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Info */}
        <div className="grid grid-cols-2 gap-3">
          {place.operatingHours && (
            <div className="rounded-2xl border-2 border-border bg-card p-3">
              <p className="mb-1 text-xs text-muted-foreground">🕐 Jam Buka</p>
              <p className="text-sm font-medium text-foreground">{place.operatingHours}</p>
            </div>
          )}
          {place.parkingInfo && (
            <div className="rounded-2xl border-2 border-border bg-card p-3">
              <p className="mb-1 text-xs text-muted-foreground">🅿️ Parkir</p>
              <p className="text-sm font-medium text-foreground">{place.parkingInfo}</p>
            </div>
          )}
          {place.waitTime && (
            <div className="rounded-2xl border-2 border-border bg-card p-3">
              <p className="mb-1 text-xs text-muted-foreground">⏱️ Waktu Nunggu</p>
              <p className="text-sm font-medium text-foreground">{place.waitTime}</p>
            </div>
          )}
        </div>

        {/* Warning */}
        {place.commonComplaint && (
          <div className="rounded-2xl border-2 border-border bg-muted p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Perlu Lu Tau
            </p>
            <p className="text-sm text-foreground">{place.commonComplaint}</p>
          </div>
        )}

        {/* Maps link */}
        <a
          href={place.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ className: "w-full gap-2" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          Buka GMaps
        </a>

        {/* Added by */}
        <div className="pt-4 text-center text-sm text-muted-foreground">
          Diusulin sama{" "}
          <span
            className={
              place.addedBy.username === "hasbi"
                ? "text-primary"
                : "text-secondary"
            }
          >
            {place.addedBy.displayName}
          </span>
        </div>
      </div>
    </div>
  );
}
