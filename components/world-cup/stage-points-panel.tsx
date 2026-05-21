import type { StageScoringRule } from "@/lib/domain/world-cup/types";

export function StagePointsPanel({ rules }: { rules: StageScoringRule[] }) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Points for the next round will appear here when your organizer opens it.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
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
              <td className="p-2 text-green-700 dark:text-green-400">+{r.correctPoints}</td>
              <td className="p-2">
                {r.incorrectPenalty === 0 ? "0" : r.incorrectPenalty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-2 py-2 text-xs text-muted-foreground">
        Only open rounds are shown. Future rounds stay hidden until your organizer reveals them.
      </p>
    </div>
  );
}
