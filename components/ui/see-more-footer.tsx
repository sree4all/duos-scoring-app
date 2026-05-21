"use client";

import { Button } from "@/components/ui/button";

export function SeeMoreFooter({
  remaining,
  onShowMore,
  label,
}: {
  remaining: number;
  onShowMore: () => void;
  label?: string;
}) {
  if (remaining <= 0) return null;

  return (
    <div className="pt-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full touch-manipulation text-base sm:h-10 sm:text-sm"
        onClick={onShowMore}
      >
        {label ?? `See more (${remaining} left)`}
      </Button>
    </div>
  );
}
