"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { saveMatchBonusAnswer } from "@/app/(authenticated)/contests/[contestId]/events/[eventId]/actions";
import type { MatchBonusPrompt } from "@/lib/domain/world-cup/match-bonus";
import { cn } from "@/lib/utils";

export function MatchBonusAnswerForm({
  contestId,
  eventId,
  matchId,
  prompts,
  initialAnswers,
  locked,
  compact = false,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  prompts: MatchBonusPrompt[];
  initialAnswers: Record<string, string>;
  locked: boolean;
  compact?: boolean;
}) {
  const router = useRouter();

  if (prompts.length === 0) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {prompts.map((prompt) => (
        <BonusPromptCard
          key={prompt.id}
          contestId={contestId}
          eventId={eventId}
          matchId={matchId}
          prompt={prompt}
          initialAnswer={initialAnswers[prompt.id] ?? ""}
          locked={locked}
          compact={compact}
          onSaved={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function BonusPromptCard({
  contestId,
  eventId,
  matchId,
  prompt,
  initialAnswer,
  locked,
  compact,
  onSaved,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  prompt: MatchBonusPrompt;
  initialAnswer: string;
  locked: boolean;
  compact: boolean;
  onSaved: () => void;
}) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasAnswer = Boolean(initialAnswer);
  const isGamble = prompt.incorrectPenalty < 0;

  async function save() {
    if (locked || !answer) return;
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveMatchBonusAnswer(
      contestId,
      eventId,
      matchId,
      prompt.id,
      answer,
    );
    if (!result.ok) {
      setError(result.error);
    } else {
      setMessage(worldCupCopy.bonus.saved);
      onSaved();
    }
    setPending(false);
  }

  return (
    <section
      className={cn(
        compact
          ? "rounded-lg border border-dashed bg-card/50 p-3"
          : "rounded-xl border-2 border-dashed bg-card p-4",
        isGamble ? "border-amber-400/50" : "border-primary/30",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          {worldCupCopy.bonus.sectionTitle}
        </p>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            isGamble
              ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
              : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
          )}
        >
          {isGamble ? worldCupCopy.bonus.gambleTag : worldCupCopy.bonus.safeTag}
        </span>
      </div>
      <p className={cn("font-medium text-white", compact ? "mt-1 text-sm" : "mt-2 text-base")}>
        {prompt.promptText}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        +{prompt.correctPoints} if correct
        {prompt.incorrectPenalty !== 0 ? ` · ${prompt.incorrectPenalty} if wrong` : ""}
      </p>
      {isGamble ? (
        <p className="mt-1 text-xs text-amber-300/90">{worldCupCopy.bonus.gambleHint}</p>
      ) : null}

      <div className={cn(compact ? "mt-2 flex flex-wrap gap-2" : "mt-3 flex flex-col gap-2")}>
        {prompt.options.map((opt) => (
          <label
            key={opt.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border-2 touch-manipulation",
              compact
                ? "min-h-9 min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-center px-2 py-1.5"
                : "min-h-11 gap-3 px-3 py-2.5",
              answer === opt.value && !locked
                ? "border-primary bg-primary/5"
                : "border-border",
              locked && "cursor-not-allowed opacity-70",
            )}
          >
            <input
              type="radio"
              name={`bonus-${prompt.id}`}
              value={opt.value}
              checked={answer === opt.value}
              disabled={locked}
              onChange={() => setAnswer(opt.value)}
              className="h-4 w-4 shrink-0"
            />
            <span className={cn("font-medium text-white", compact ? "truncate text-xs" : "text-sm")}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>

      {!locked ? (
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "touch-manipulation",
            compact ? "mt-2 h-9 w-full text-xs sm:w-auto" : "mt-3 h-11 w-full sm:w-auto",
          )}
          disabled={pending || !answer}
          onClick={save}
        >
          {hasAnswer ? worldCupCopy.bonus.update : worldCupCopy.bonus.save}
        </Button>
      ) : null}

      {message ? <p className="mt-2 text-sm text-status-success">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
