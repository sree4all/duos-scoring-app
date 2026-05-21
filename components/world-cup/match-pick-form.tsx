"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { saveMatchPick } from "@/app/(authenticated)/contests/[contestId]/events/[eventId]/actions";
import { cn } from "@/lib/utils";

export function MatchPickForm({
  contestId,
  eventId,
  matchId,
  homeTeam,
  awayTeam,
  initialPick,
  locked,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  initialPick: string | null;
  locked: boolean;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(initialPick ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasSavedPick = Boolean(initialPick);
  const statusLabel = hasSavedPick
    ? worldCupCopy.prediction.alreadyPredicted
    : worldCupCopy.prediction.duePrediction;

  async function save() {
    if (locked) {
      setError(worldCupCopy.errors.predictionsClosed);
      return;
    }
    if (!pick) return;
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveMatchPick(contestId, eventId, matchId, pick);
    if (!result.ok) {
      setError(result.error);
    } else {
      setMessage(worldCupCopy.prediction.saved);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <section className="rounded-xl border-2 border-border bg-card p-5 shadow-sm">
      <div
        className={cn(
          "rounded-md px-3 py-2 text-center text-sm font-semibold",
          hasSavedPick
            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
        )}
      >
        {statusLabel}
      </div>

      <p className="mt-4 text-base font-medium">{worldCupCopy.prediction.whoWillWin}</p>

      <div className="mt-4 flex flex-col gap-3">
        {[homeTeam, awayTeam].map((team) => (
          <label
            key={team}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-base transition-colors",
              pick === team && !locked
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50",
              locked && "cursor-not-allowed opacity-70",
            )}
          >
            <input
              type="radio"
              name="winner"
              value={team}
              checked={pick === team}
              disabled={locked}
              onChange={() => setPick(team)}
              className="h-5 w-5"
            />
            <span className="font-medium">{team}</span>
          </label>
        ))}
      </div>

      {!locked ? (
        <Button
          type="button"
          className="mt-5 w-full sm:w-auto"
          size="lg"
          disabled={pending || !pick}
          onClick={save}
        >
          {hasSavedPick
            ? worldCupCopy.prediction.update
            : worldCupCopy.prediction.save}
        </Button>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{worldCupCopy.matchStatus.locked}</p>
      )}

      {message ? <p className="mt-3 text-sm font-medium text-green-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
