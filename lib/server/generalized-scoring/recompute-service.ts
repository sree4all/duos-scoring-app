import { appendLedgerEntry } from "./ledger-service";

export interface RecomputeInput {
  contestId: string;
  participantId: string;
  delta: number;
  correlationId: string;
  reason: string;
}

export async function appendRecomputeDelta(input: RecomputeInput) {
  return appendLedgerEntry({
    contestId: input.contestId,
    participantId: input.participantId,
    actionType: "recompute_delta",
    pointsDelta: input.delta,
    correlationId: input.correlationId,
    reasonText: input.reason,
  });
}
