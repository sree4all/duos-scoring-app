"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ADVANCED_BRACKET_POINTS,
  type AdvancedBracketOfficial,
  type AdvancedBracketPhaseReadiness,
  type AdvancedBracketScoringPhase,
} from "@/lib/domain/world-cup/advanced-bracket";

const PHASE_META: Record<
  AdvancedBracketScoringPhase,
  { title: string; points: string }
> = {
  semi_finalists: {
    title: "Semi-finalists",
    points: `+${ADVANCED_BRACKET_POINTS.semiFinalist} per correct pick`,
  },
  finalists: {
    title: "Finalists",
    points: `+${ADVANCED_BRACKET_POINTS.finalist} per correct pick`,
  },
  winner: {
    title: "Champion",
    points: `+${ADVANCED_BRACKET_POINTS.winner} for the correct pick`,
  },
};

function scoredAtForPhase(
  official: AdvancedBracketOfficial | null,
  phase: AdvancedBracketScoringPhase,
): string | null {
  if (!official) return null;
  if (phase === "semi_finalists") return official.semiFinalistsScoredAt;
  if (phase === "finalists") return official.finalistsScoredAt;
  return official.winnerScoredAt;
}

export function AdvancedBracketOwnerPanel({
  groupId,
  contestId,
  official,
  readiness,
}: {
  groupId: string;
  contestId: string;
  official: AdvancedBracketOfficial | null;
  readiness: AdvancedBracketPhaseReadiness[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function score(phase: AdvancedBracketScoringPhase) {
    setPending(phase);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/contests/${contestId}/advanced-bracket/score`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase }),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        rowsAwarded?: number;
        officialTeams?: string[];
      };
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      setMessage(
        `Scored ${PHASE_META[phase].title.toLowerCase()}: ${data.rowsAwarded ?? 0} members awarded (${(data.officialTeams ?? []).join(", ")}).`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <h2 className="text-sm font-semibold">Organizer — tournament forecast scoring</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Each question can be scored as soon as its answer is known: semi-finalists after the
        quarter-finals, finalists after the semi-finals, champion after the Final. Applying match
        scoring also scores any ready forecast phases automatically. Re-running a question replaces
        its previous points, so it is safe after a result correction.
      </p>

      <ul className="mt-3 space-y-3">
        {readiness.map((item) => {
          const meta = PHASE_META[item.phase];
          const scoredAt = scoredAtForPhase(official, item.phase);
          return (
            <li
              key={item.phase}
              className="rounded-lg border border-white/10 bg-card/40 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    {meta.title}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {meta.points}
                    </span>
                  </p>
                  {item.ready ? (
                    <p className="mt-1 text-xs text-status-success">
                      Official answer ready: {item.officialPreview.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">{item.blockedReason}</p>
                  )}
                  {scoredAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Scored {new Date(scoredAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(pending) || !item.ready}
                  onClick={() => score(item.phase)}
                >
                  {pending === item.phase
                    ? "Scoring…"
                    : scoredAt
                      ? "Re-run scoring"
                      : "Score now"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {message ? <p className="mt-2 text-xs text-status-success">{message}</p> : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
