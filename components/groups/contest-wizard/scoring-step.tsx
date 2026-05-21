"use client";

export function ScoringStep({
  formatLabel,
}: {
  formatLabel: "prediction" | "rummy_points" | "world_cup_prediction";
}) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Step 4: Scoring preset</h2>
      {formatLabel === "world_cup_prediction" ? (
        <p className="text-sm text-muted-foreground">
          World Cup contests use per-stage points (group stage through final). Default stage
          rules are created when you publish; adjust points and reveal each round from the
          group owner stages page after import.
        </p>
      ) : formatLabel === "prediction" ? (
        <p className="text-sm text-muted-foreground">
          Prediction contests use match winner and bonus points from{" "}
          <code className="text-xs">scoring_config</code> via the group prediction adapter.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Points rummy uses the <code className="text-xs">points_rummy_standard</code> preset
          (drops, cap, full count). Hand entry is available after publish.
        </p>
      )}
    </section>
  );
}
