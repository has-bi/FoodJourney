"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  max?: number;
}

export function StarRating({ rating, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Rate ${i + 1}`}
          onClick={() => onChange(i + 1)}
          className={cn(
            "text-2xl transition-transform",
            rating >= i + 1 ? "text-foreground" : "text-muted-foreground/50"
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
