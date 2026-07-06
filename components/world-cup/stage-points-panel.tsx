import type { StageScoringRule } from "@/lib/domain/world-cup/types";

export function StagePointsPanel({ rules }: { rules: StageScoringRule[] }) {
  return (
    <details className="rounded-lg border bg-card text-sm">
      <summary className="cursor-pointer px-3 py-2 font-semibold touch-manipulation">
        How points work
      </summary>
      <div className="space-y-2 border-t px-3 pb-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Only rounds your organizer has opened are listed below.
        </p>

        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Points for the next round will appear here when your organizer opens it.
          </p>
        ) : (
          <>
            <ul className="space-y-2 sm:hidden">
              {rules.map((r) => (
                <li key={r.stageKey} className="rounded-lg border bg-background p-3 text-sm">
                  <p className="font-medium">{r.stageName}</p>
                  <p className="mt-1 text-muted-foreground">
                    Correct:{" "}
                    <span className="font-medium text-score-positive">+{r.correctPoints}</span>
                    {" · "}
                    Wrong:{" "}
                    <span className="font-medium">
                      {r.incorrectPenalty === 0 ? "0" : r.incorrectPenalty}
                    </span>
                  </p>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-lg border sm:block">
              <table className="w-full min-w-[280px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2">Round</th>
                    <th className="p-2">Correct</th>
                    <th className="p-2">Wrong</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.stageKey} className="border-b last:border-0">
                      <td className="p-2 font-medium">{r.stageName}</td>
                      <td className="p-2 text-score-positive">+{r.correctPoints}</td>
                      <td className="p-2">
                        {r.incorrectPenalty === 0 ? "0" : r.incorrectPenalty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Only open rounds are shown. Future rounds stay hidden until your organizer reveals
              them.
            </p>
          </>
        )}
      </div>
    </details>
  );
}
