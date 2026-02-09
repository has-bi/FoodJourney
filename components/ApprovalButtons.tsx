"use client";

import { useTransition } from "react";
import { approvePlace, skipPlace } from "@/app/actions/place";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    <div className="mt-3 flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isPending}>
        Ogah
      </Button>
      <Button size="sm" onClick={handleApprove} disabled={isPending}>
        {isPending ? <Spinner size="xs" /> : "Gas! 🔥"}
      </Button>
    </div>
  );
}
