/** True when kickoff is still in the future (peer picks stay hidden for members). */
export function isBeforeKickoff(kickoffUtc: string, nowMs = Date.now()): boolean {
  const kickoff = Date.parse(kickoffUtc);
  if (Number.isNaN(kickoff)) return true;
  return nowMs < kickoff;
}

/** Regular members: hide peer picks until kickoff. Owners always see all. */
export function shouldHidePeerPredictions(
  isOwner: boolean,
  kickoffUtc: string,
  nowMs = Date.now(),
): boolean {
  if (isOwner) return false;
  return isBeforeKickoff(kickoffUtc, nowMs);
}
