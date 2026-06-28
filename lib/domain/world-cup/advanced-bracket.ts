export const ADVANCED_BRACKET_PICKS = {
  semiFinalists: 4,
  finalists: 2,
  winner: 1,
} as const;

export const ADVANCED_BRACKET_POINTS = {
  semiFinalist: 10,
  finalist: 15,
  winner: 20,
} as const;

export type AdvancedBracketScoringPhase = "semi_finalists" | "finalists" | "winner";

export type AdvancedBracketPicks = {
  semiFinalistTeams: string[];
  finalistTeams: string[];
  winnerTeam: string | null;
};

export type AdvancedBracketOfficial = {
  semiFinalistTeams: string[];
  finalistTeams: string[];
  winnerTeam: string | null;
  semiFinalistsScoredAt: string | null;
  finalistsScoredAt: string | null;
  winnerScoredAt: string | null;
};

export function isPlaceholderTeam(name: string): boolean {
  const n = name.trim().toLowerCase();
  return !n || n.includes("tbd") || n.includes("playoff") || n.includes("winner");
}

export function validateAdvancedBracketPicks(
  picks: AdvancedBracketPicks,
  eligibleTeams: string[],
): string | null {
  const eligible = new Set(eligibleTeams);

  if (picks.semiFinalistTeams.length !== ADVANCED_BRACKET_PICKS.semiFinalists) {
    return `Pick exactly ${ADVANCED_BRACKET_PICKS.semiFinalists} semi-finalists.`;
  }
  if (new Set(picks.semiFinalistTeams).size !== picks.semiFinalistTeams.length) {
    return "Semi-finalist picks must be distinct teams.";
  }
  for (const team of picks.semiFinalistTeams) {
    if (!eligible.has(team)) return `Invalid semi-finalist team: ${team}`;
  }

  if (picks.finalistTeams.length !== ADVANCED_BRACKET_PICKS.finalists) {
    return `Pick exactly ${ADVANCED_BRACKET_PICKS.finalists} finalists.`;
  }
  if (new Set(picks.finalistTeams).size !== picks.finalistTeams.length) {
    return "Finalist picks must be distinct teams.";
  }
  for (const team of picks.finalistTeams) {
    if (!eligible.has(team)) return `Invalid finalist team: ${team}`;
  }

  if (!picks.winnerTeam?.trim()) {
    return "Pick a tournament winner.";
  }
  if (!eligible.has(picks.winnerTeam)) {
    return `Invalid winner team: ${picks.winnerTeam}`;
  }

  return null;
}

export function countCorrectPicks(userPicks: string[], officialTeams: string[]): number {
  const official = new Set(officialTeams);
  let count = 0;
  const used = new Set<string>();
  for (const pick of userPicks) {
    if (official.has(pick) && !used.has(pick)) {
      count++;
      used.add(pick);
    }
  }
  return count;
}
