"use client";

import { useTransition } from "react";
import { approvePlace, skipPlace } from "@/app/actions/place";

interface ApprovalButtonsProps {
  placeId: string;
}

export function ApprovalButtons({ placeId }: ApprovalButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(() => {
      approvePlace(placeId);
    });
  };

  const handleSkip = () => {
    startTransition(() => {
      skipPlace(placeId);
    });
  };

  return (
    <div className="card-actions justify-end mt-3">
      <button
        className="btn btn-sm btn-ghost"
        onClick={handleSkip}
        disabled={isPending}
      >
        Skip
      </button>
      <button
        className="btn btn-sm btn-primary"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          "Plan It"
        )}
      </button>
    </div>
  );
}
