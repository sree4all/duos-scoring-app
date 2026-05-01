"use server";

import { isSubmissionEditable } from "@/lib/server/generalized-scoring/lock-policy-service";

export async function submitParticipantEntry(locked: boolean) {
  if (!isSubmissionEditable(locked)) {
    return { ok: false, message: "Event is locked." };
  }

  return { ok: true };
}
