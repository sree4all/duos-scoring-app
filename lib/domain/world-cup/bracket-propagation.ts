import { normMatchOutcome } from "@/lib/domain/world-cup/match-outcome";

/** Whether a saved winner pick still matches either team on the fixture. */
export function pickMatchesFixture(
  homeTeam: string,
  awayTeam: string,
  predictedWinner: string,
): boolean {
  const pick = normMatchOutcome(predictedWinner);
  if (!pick) return false;
  return pick === normMatchOutcome(homeTeam) || pick === normMatchOutcome(awayTeam);
}

/** Team names no longer on the fixture after a slot update. */
export function teamsRemovedFromFixture(
  oldHome: string,
  oldAway: string,
  newHome: string,
  newAway: string,
): string[] {
  const newNorm = new Set(
    [newHome, newAway].map((t) => normMatchOutcome(t)).filter(Boolean),
  );
  const removed: string[] = [];
  for (const team of [oldHome, oldAway]) {
    const n = normMatchOutcome(team);
    if (n && !newNorm.has(n)) removed.push(team);
  }
  return removed;
}

/** True when bonus answer text references any of the given team names. */
export function bonusAnswerReferencesTeam(
  answerText: string,
  teamNames: readonly string[],
): boolean {
  const answer = answerText.trim().toLowerCase();
  if (!answer) return false;
  for (const team of teamNames) {
    const t = team.trim().toLowerCase();
    if (t.length >= 3 && answer.includes(t)) return true;
  }
  return false;
}

export function shouldClearBonusAnswer(
  answerText: string,
  affectedTeamNames: readonly string[],
): boolean {
  return bonusAnswerReferencesTeam(answerText, affectedTeamNames);
}
