"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { MATCH_DRAW_PICK } from "@/lib/domain/world-cup/match-outcome";
import { saveMatchPick } from "@/app/(authenticated)/contests/[contestId]/events/[eventId]/actions";
import { cn } from "@/lib/utils";

function PickOptions({
  options,
  pick,
  locked,
  name,
  onPick,
  compact,
}: {
  options: string[];
  pick: string;
  locked: boolean;
  name: string;
  onPick: (value: string) => void;
  compact: boolean;
}) {
  return (
    <div className={cn(compact ? "flex flex-wrap gap-2" : "mt-4 flex flex-col gap-3")}>
      {options.map((team) => (
        <label
          key={team}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border-2 transition-colors touch-manipulation",
            compact
              ? "min-h-10 min-w-0 flex-1 basis-[calc(33.333%-0.5rem)] justify-center px-2 py-2 text-sm"
              : "min-h-12 gap-3 px-4 py-3 text-base",
            pick === team && !locked
              ? "border-primary bg-primary/5"
              : "border-white/10 hover:bg-white/10",
            locked && "cursor-not-allowed opacity-70",
          )}
        >
          <input
            type="radio"
            name={name}
            value={team}
            checked={pick === team}
            disabled={locked}
            onChange={() => onPick(team)}
            className={compact ? "h-4 w-4 shrink-0" : "h-5 w-5"}
          />
          <span className={cn("font-medium", compact ? "truncate" : "break-words")}>{team}</span>
        </label>
      ))}
    </div>
  );
}

export function MatchPickForm({
  contestId,
  eventId,
  matchId,
  homeTeam,
  awayTeam,
  allowDraw,
  initialPick,
  locked,
  embedded = false,
  compact = false,
  onSaved,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  allowDraw: boolean;
  initialPick: string | null;
  locked: boolean;
  embedded?: boolean;
  compact?: boolean;
  onSaved?: (pick: string) => void;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(initialPick ?? "");
  const [savedPick, setSavedPick] = useState(initialPick);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPick(initialPick ?? "");
    setSavedPick(initialPick);
  }, [initialPick]);

  const hasSavedPick = Boolean(savedPick);
  const statusLabel = hasSavedPick
    ? worldCupCopy.prediction.alreadyPredicted
    : worldCupCopy.prediction.duePrediction;
  const options = allowDraw ? [homeTeam, MATCH_DRAW_PICK, awayTeam] : [homeTeam, awayTeam];

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
      setSavedPick(pick);
      setMessage(worldCupCopy.prediction.saved);
      onSaved?.(pick);
      router.refresh();
    }
    setPending(false);
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-score-positive">
          {worldCupCopy.prediction.yourPick}
        </p>
        <PickOptions
          options={options}
          pick={pick}
          locked={locked}
          name={`winner-${eventId}`}
          onPick={setPick}
          compact
        />
        {!locked ? (
          <Button
            type="button"
            className="h-10 w-full touch-manipulation sm:w-auto"
            size="cta-compact"
            disabled={pending || !pick}
            onClick={save}
          >
            {hasSavedPick
              ? worldCupCopy.prediction.update
              : worldCupCopy.prediction.save}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">{worldCupCopy.matchStatus.locked}</p>
        )}
        {message ? <p className="text-xs font-medium text-status-success">{message}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <section className={embedded ? "space-y-4" : "neon-glass-card space-y-4 p-5"}>
      <div
        className={cn(
          "rounded-xl px-3 py-2 text-center text-sm font-semibold",
          hasSavedPick
            ? "bg-neon-score-green/20 text-score-positive"
            : "bg-neon-score-red/20 text-score-negative",
        )}
      >
        {statusLabel}
      </div>

      <p className="mt-4 text-base font-medium">
        {allowDraw ? worldCupCopy.prediction.howWillItEnd : worldCupCopy.prediction.whoWillWin}
      </p>
      {allowDraw ? (
        <p className="text-sm text-muted-foreground">{worldCupCopy.prediction.groupStageDrawHint}</p>
      ) : null}

      <PickOptions
        options={options}
        pick={pick}
        locked={locked}
        name="winner"
        onPick={setPick}
        compact={false}
      />

      {!locked ? (
        <Button
          type="button"
          className="mt-5 w-full touch-manipulation"
          size="cta-compact"
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

      {message ? <p className="mt-3 text-sm font-medium text-status-success">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
