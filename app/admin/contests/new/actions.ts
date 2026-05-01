"use server";

import { validatePublishReadiness } from "@/lib/server/generalized-scoring/publish-validation";

export async function saveContestDraft() {
  return { ok: true };
}

export async function publishContest() {
  const validation = validatePublishReadiness({
    hasEvents: true,
    hasScoringPreset: true,
    hasValidLockPolicy: true,
  });

  return validation;
}
