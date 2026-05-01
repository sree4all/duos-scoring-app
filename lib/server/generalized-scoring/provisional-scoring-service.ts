export interface ProvisionalTotalsInput {
  resolvedPoints: number;
  unresolvedMetricCount: number;
}

export function getProvisionalTotals(input: ProvisionalTotalsInput) {
  return {
    totalPoints: input.resolvedPoints,
    isProvisional: input.unresolvedMetricCount > 0,
    unresolvedMetricCount: input.unresolvedMetricCount,
  };
}
