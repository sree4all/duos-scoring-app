"use client";

export type ContestDetailsValues = {
  name: string;
  formatLabel: "prediction" | "rummy_points" | "world_cup_prediction";
};

export function ContestDetailsStep({
  values,
  onChange,
  worldCupOnly = false,
}: {
  values: ContestDetailsValues;
  onChange: (values: ContestDetailsValues) => void;
  worldCupOnly?: boolean;
}) {
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="font-medium">Step 1: Contest details</h2>
      <div className="space-y-2">
        <label htmlFor="contest-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="contest-name"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          placeholder="Spring league"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="contest-format" className="text-sm font-medium">
          Format
        </label>
        {worldCupOnly ? (
          <p className="text-sm text-muted-foreground">World Cup 2026 prediction</p>
        ) : (
          <select
            id="contest-format"
            className="neon-input w-full text-sm"
            value={values.formatLabel}
            onChange={(e) =>
              onChange({
                ...values,
                formatLabel: e.target.value as ContestDetailsValues["formatLabel"],
              })
            }
          >
            <option value="world_cup_prediction">World Cup 2026 (prediction)</option>
            <option value="prediction">Prediction league</option>
            <option value="rummy_points">Points rummy</option>
          </select>
        )}
      </div>
    </section>
  );
}
