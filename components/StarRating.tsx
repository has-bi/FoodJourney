"use client";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  max?: number;
}

export function StarRating({ rating, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="rating rating-lg">
      {Array.from({ length: max }, (_, i) => (
        <input
          key={i}
          type="radio"
          name="rating"
          className="mask mask-star-2 bg-warning"
          checked={rating === i + 1}
          onChange={() => onChange(i + 1)}
        />
      ))}
    </div>
  );
}
