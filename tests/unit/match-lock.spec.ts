/**
 * Run: npx tsx tests/unit/match-lock.spec.ts
 */
import {
  defaultMatchLockAt,
  defaultMatchLockAtIso,
  isMatchLocked,
  isPredictionsLocked,
  resolvePredictionLockAt,
  resolvePredictionLockAtIso,
} from "../../lib/utils/match-lock";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const KICKOFF = "2026-06-15T23:00:00.000Z";

function run() {
  assert(defaultMatchLockAtIso(KICKOFF) === KICKOFF, "default lock is kickoff");

  const ownerLock = "2026-06-15T20:00:00.000Z";
  assert(
    resolvePredictionLockAtIso(KICKOFF, ownerLock) === ownerLock,
    "owner earlier lock is honored",
  );

  const lateOwnerLock = "2026-06-15T23:30:00.000Z";
  assert(
    resolvePredictionLockAtIso(KICKOFF, lateOwnerLock) === KICKOFF,
    "owner lock capped at kickoff",
  );

  const boundary = defaultMatchLockAt(KICKOFF);
  assert(!isMatchLocked(KICKOFF, boundary), "open at exact lock boundary");
  assert(!isPredictionsLocked(KICKOFF, null, boundary), "open at exact boundary with helper");

  const afterBoundary = new Date(defaultMatchLockAt(KICKOFF).getTime() + 1);
  assert(isMatchLocked(KICKOFF, afterBoundary), "locked after boundary");
  assert(isPredictionsLocked(KICKOFF, null, afterBoundary), "locked after boundary with helper");

  const afterOwnerLock = new Date("2026-06-15T20:00:00.001Z");
  assert(
    resolvePredictionLockAt(KICKOFF, ownerLock).toISOString() === ownerLock,
    "resolved owner lock date",
  );
  assert(
    isPredictionsLocked(KICKOFF, ownerLock, afterOwnerLock),
    "locked after earlier owner deadline",
  );

  console.log("match-lock.spec.ts: all assertions passed");
}

run();
