export type ContestFormatLabel = "prediction" | "rummy_points" | string | null | undefined;

const LABELS: Record<string, { text: string; className: string }> = {
  prediction: {
    text: "Prediction",
    className: "bg-blue-100 text-blue-900",
  },
  rummy_points: {
    text: "Points rummy",
    className: "bg-emerald-100 text-emerald-900",
  },
};

export function ContestFormatBadge({ formatLabel }: { formatLabel: ContestFormatLabel }) {
  const key = formatLabel ?? "prediction";
  const style = LABELS[key] ?? {
    text: key,
    className: "bg-slate-100 text-slate-800",
  };

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.text}
    </span>
  );
}

export function ContestStateBadge({ state }: { state: string }) {
  const muted = state === "draft" || state === "archived";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs ${
        muted ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-900"
      }`}
    >
      {state}
    </span>
  );
}
