import type { StageScoringRule } from "@/lib/domain/world-cup/types";

export function StagePointsPanel({ rules }: { rules: StageScoringRule[] }) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Point rules for future rounds will show here when your owner opens them.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="p-2">Round</th>
            <th className="p-2">Right pick</th>
            <th className="p-2">Wrong pick</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.stageKey} className="border-b last:border-0">
              <td className="p-2">{r.stageName}</td>
              <td className="p-2">+{r.correctPoints}</td>
              <td className="p-2">{r.incorrectPenalty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
