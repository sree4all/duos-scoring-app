"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StageScoringRule } from "@/lib/domain/world-cup/types";

export function WorldCupStagesPanel({
  groupId,
  contestId,
}: {
  groupId: string;
  contestId: string;
}) {
  const [rules, setRules] = useState<StageScoringRule[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/groups/${groupId}/contests/${contestId}/stages`);
    const data = (await res.json()) as { rules?: StageScoringRule[] };
    setRules(data.rules ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on contest/group change only
  }, [groupId, contestId]);

  async function patchStage(
    stageKey: string,
    patch: { correctPoints?: number; incorrectPenalty?: number; revealed?: boolean },
  ) {
    setPending(true);
    setMessage(null);
    await fetch(`/api/groups/${groupId}/contests/${contestId}/stages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageKey, ...patch }),
    });
    await load();
    setPending(false);
  }

  async function recalculate(stageKey: string) {
    const reason = window.prompt("Why are you recalculating this round?");
    if (!reason?.trim()) return;
    setPending(true);
    const res = await fetch(
      `/api/groups/${groupId}/contests/${contestId}/stages/recalculate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageKey, reason: reason.trim() }),
      },
    );
    const data = (await res.json()) as { rescored?: number; errors?: string[] };
    setMessage(`Recalculated ${data.rescored ?? 0} matches.`);
    setPending(false);
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Open each round when players should see those matches. Edit points before or after opening.
      </p>
      {rules.map((r) => (
        <div key={r.stageKey} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">{r.stageName}</h3>
            <span className="text-xs text-muted-foreground">
              {r.revealedAt ? "Open to players" : "Hidden"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label>
              Correct
              <input
                type="number"
                className="ml-2 w-16 rounded border px-2"
                defaultValue={r.correctPoints}
                onBlur={(e) =>
                  patchStage(r.stageKey, { correctPoints: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Wrong
              <input
                type="number"
                className="ml-2 w-16 rounded border px-2"
                defaultValue={r.incorrectPenalty}
                onBlur={(e) =>
                  patchStage(r.stageKey, { incorrectPenalty: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!r.revealedAt ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => patchStage(r.stageKey, { revealed: true })}
              >
                Open this round
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => recalculate(r.stageKey)}
            >
              Recalculate round
            </Button>
          </div>
        </div>
      ))}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </section>
  );
}
