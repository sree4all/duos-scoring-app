export const MATCH_LOCK_LEAD_MS = 30 * 60 * 1000;

export function defaultMatchLockAt(kickoffUtc: Date | string): Date {
  const kickoff = typeof kickoffUtc === "string" ? new Date(kickoffUtc) : kickoffUtc;
  return new Date(kickoff.getTime() - MATCH_LOCK_LEAD_MS);
}

export function defaultMatchLockAtIso(kickoffUtc: Date | string): string {
  return defaultMatchLockAt(kickoffUtc).toISOString();
}

/**
 * Effective prediction lock: owner MAY close earlier; never later than kickoff − 30 minutes.
 */
export function resolvePredictionLockAt(
  kickoffUtc: Date | string,
  ownerLockAt?: string | null,
): Date {
  const defaultLock = defaultMatchLockAt(kickoffUtc);
  if (!ownerLockAt) return defaultLock;
  const ownerLock = new Date(ownerLockAt);
  return ownerLock.getTime() < defaultLock.getTime() ? ownerLock : defaultLock;
}

export function resolvePredictionLockAtIso(
  kickoffUtc: Date | string,
  ownerLockAt?: string | null,
): string {
  return resolvePredictionLockAt(kickoffUtc, ownerLockAt).toISOString();
}

/**
 * Lock applies when current time is strictly after the effective lock boundary.
 * Predictions are rejected in that case; at exactly the boundary the window is still open.
 */
export function isMatchLocked(
  matchTimeUtc: Date | string,
  nowUtc: Date = new Date(),
): boolean {
  return isPredictionsLocked(matchTimeUtc, null, nowUtc);
}

export function isPredictionsLocked(
  kickoffUtc: Date | string,
  ownerLockAt?: string | null,
  nowUtc: Date = new Date(),
): boolean {
  const lockBoundary = resolvePredictionLockAt(kickoffUtc, ownerLockAt);
  return nowUtc.getTime() > lockBoundary.getTime();
}

/** True while predictions may still be submitted or revised (inverse of lock). */
export function isPredictionWindowOpen(
  kickoffUtc: Date | string,
  ownerLockAt?: string | null,
  nowUtc?: Date,
): boolean {
  return !isPredictionsLocked(kickoffUtc, ownerLockAt, nowUtc ?? new Date());
}
