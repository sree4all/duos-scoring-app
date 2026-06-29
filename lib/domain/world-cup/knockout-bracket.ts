/** FIFA World Cup 2026 knockout bracket feeders (matches 73–102). */
export const KNOCKOUT_FEEDERS: Record<number, readonly [number, number]> = {
  89: [73, 75],
  90: [74, 77],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
};

export const ROUND_OF_32_MATCH_NUMBERS = Array.from({ length: 16 }, (_, i) => 73 + i);

/** Knockout matches whose winner feeds the semi-finals (R32 through QF). */
export const PRE_SEMI_KNOCKOUT_MATCHES = Array.from({ length: 28 }, (_, i) => 73 + i);

export type KnockoutFixture = {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
};

export type KnockoutBracket = {
  fixtures: Map<number, KnockoutFixture>;
};

export function buildKnockoutBracket(fixtures: KnockoutFixture[]): KnockoutBracket {
  const map = new Map<number, KnockoutFixture>();
  for (const f of fixtures) {
    map.set(f.matchNumber, f);
  }
  return { fixtures: map };
}

/** All team names that could win through this match slot (R32 leaves only). */
export function teamsInKnockoutSubtree(bracket: KnockoutBracket, matchNumber: number): string[] {
  const feeders = KNOCKOUT_FEEDERS[matchNumber];
  if (feeders) {
    const left = teamsInKnockoutSubtree(bracket, feeders[0]);
    const right = teamsInKnockoutSubtree(bracket, feeders[1]);
    return [...new Set([...left, ...right])];
  }

  const fixture = bracket.fixtures.get(matchNumber);
  if (!fixture) return [];
  return [fixture.homeTeam, fixture.awayTeam].filter(Boolean);
}

/**
 * Teams hidden from semi-finalist picks given current selections.
 * At most one team per knockout path (R32/R16/QF) can reach the semi-finals.
 */
export function hiddenSemiFinalistTeams(
  bracket: KnockoutBracket,
  selected: string[],
): Set<string> {
  const hidden = new Set<string>();
  const selectedSet = new Set(selected);

  for (const matchNumber of PRE_SEMI_KNOCKOUT_MATCHES) {
    const subtree = teamsInKnockoutSubtree(bracket, matchNumber);
    if (subtree.length === 0) continue;

    const pickedHere = subtree.filter((t) => selectedSet.has(t));
    if (pickedHere.length === 0) continue;

    for (const team of subtree) {
      if (!selectedSet.has(team)) hidden.add(team);
    }
  }

  return hidden;
}

export function visibleSemiFinalistTeams(
  bracket: KnockoutBracket,
  allTeams: string[],
  selected: string[],
): string[] {
  const hidden = hiddenSemiFinalistTeams(bracket, selected);
  const selectedSet = new Set(selected);
  return allTeams.filter((t) => selectedSet.has(t) || !hidden.has(t));
}

/** True when two picks cannot both reach the semi-finals on this bracket. */
export function semiFinalistPicksConflict(
  bracket: KnockoutBracket,
  teamA: string,
  teamB: string,
): boolean {
  if (teamA === teamB) return false;
  for (const matchNumber of PRE_SEMI_KNOCKOUT_MATCHES) {
    const subtree = new Set(teamsInKnockoutSubtree(bracket, matchNumber));
    if (subtree.has(teamA) && subtree.has(teamB)) return true;
  }
  return false;
}

export function validateSemiFinalistBracketPath(
  bracket: KnockoutBracket,
  semiFinalistTeams: string[],
): string | null {
  for (let i = 0; i < semiFinalistTeams.length; i++) {
    for (let j = i + 1; j < semiFinalistTeams.length; j++) {
      if (semiFinalistPicksConflict(bracket, semiFinalistTeams[i], semiFinalistTeams[j])) {
        return `${semiFinalistTeams[i]} and ${semiFinalistTeams[j]} cannot both reach the semi-finals on this bracket.`;
      }
    }
  }
  return null;
}
