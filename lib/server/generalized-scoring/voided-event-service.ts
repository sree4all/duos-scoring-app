export interface VoidedEventReversal {
  priorEventPoints: number;
}

/** Net reversal entries should sum to -priorEventPoints so totals for the event become zero */
export function buildVoidReversalDelta(prior: VoidedEventReversal) {
  return -prior.priorEventPoints;
}
