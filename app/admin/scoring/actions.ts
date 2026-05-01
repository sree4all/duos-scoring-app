"use server";

import { randomUUID } from "crypto";

import { appendLedgerEntry } from "@/lib/server/generalized-scoring/ledger-service";
import { evaluatePresetScore } from "@/lib/server/generalized-scoring/scoring-engine";

export async function runEventScoring(input: Parameters<typeof evaluatePresetScore>[0]) {
  const result = evaluatePresetScore(input);
  await appendLedgerEntry({
    contestId: input.contestId,
    participantId: input.participantId,
    actionType: "score_award",
    pointsDelta: result.pointsDelta,
    correlationId: randomUUID(),
  });
  return result;
}

export async function enqueueRecomputeJob(eventId: string, reason: string) {
  return { ok: true as const, eventId, reason };
}
