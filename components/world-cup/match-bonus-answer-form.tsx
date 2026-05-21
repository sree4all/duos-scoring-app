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
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  prompts: MatchBonusPrompt[];
  initialAnswers: Record<string, string>;
  locked: boolean;
}) {
  const router = useRouter();

  if (prompts.length === 0) return null;

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <BonusPromptCard
          key={prompt.id}
          contestId={contestId}
          eventId={eventId}
          matchId={matchId}
          prompt={prompt}
          initialAnswer={initialAnswers[prompt.id] ?? ""}
          locked={locked}
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
  onSaved,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  prompt: MatchBonusPrompt;
  initialAnswer: string;
  locked: boolean;
  onSaved: () => void;
}) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasAnswer = Boolean(initialAnswer);

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
    <section className="rounded-xl border-2 border-dashed border-primary/30 bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {worldCupCopy.bonus.sectionTitle}
      </p>
      <p className="mt-2 text-base font-medium">{prompt.promptText}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        +{prompt.correctPoints} if correct
        {prompt.incorrectPenalty !== 0 ? ` · ${prompt.incorrectPenalty} if wrong` : ""}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {prompt.options.map((opt) => (
          <label
            key={opt.id}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2.5 touch-manipulation",
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
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">{opt.label}</span>
          </label>
        ))}
      </div>

      {!locked ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 h-11 w-full touch-manipulation sm:w-auto"
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
