export interface RecomputeMarker {
  correlationId: string;
  resolvedAt: string;
  label: string;
}

export function buildRecomputeHistoryMarker(
  correlationId: string,
  label = "Scores recalculated"
): RecomputeMarker {
  return {
    correlationId,
    resolvedAt: new Date().toISOString(),
    label,
  };
}
