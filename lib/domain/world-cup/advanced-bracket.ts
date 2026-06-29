import type { KnockoutBracket } from "@/lib/domain/world-cup/knockout-bracket";
import { validateSemiFinalistBracketPath } from "@/lib/domain/world-cup/knockout-bracket";

export const ADVANCED_BRACKET_PICKS = {
  semiFinalists: 4,
  finalists: 2,
  winner: 1,
} as const;

/** Tournament forecast locks at kickoff of this Round of 32 match (July 3, 2026 6:00 PM ET). */
export const ADVANCED_BRACKET_LOCK_MATCH_NUMBER = 88;

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
  bracket?: KnockoutBracket | null,
): string | null {
  const eligible = new Set(eligibleTeams);
  const semiSet = new Set(picks.semiFinalistTeams);

  if (picks.semiFinalistTeams.length !== ADVANCED_BRACKET_PICKS.semiFinalists) {
    return `Pick exactly ${ADVANCED_BRACKET_PICKS.semiFinalists} semi-finalists.`;
  }
  if (semiSet.size !== picks.semiFinalistTeams.length) {
    return "Semi-finalist picks must be distinct teams.";
  }
  for (const team of picks.semiFinalistTeams) {
    if (!eligible.has(team)) return `Invalid semi-finalist team: ${team}`;
  }

  if (bracket) {
    const pathError = validateSemiFinalistBracketPath(bracket, picks.semiFinalistTeams);
    if (pathError) return pathError;
  }

  if (picks.finalistTeams.length !== ADVANCED_BRACKET_PICKS.finalists) {
    return `Pick exactly ${ADVANCED_BRACKET_PICKS.finalists} finalists from your semi-finalists.`;
  }
  if (new Set(picks.finalistTeams).size !== picks.finalistTeams.length) {
    return "Finalist picks must be distinct teams.";
  }
  for (const team of picks.finalistTeams) {
    if (!semiSet.has(team)) {
      return "Finalists must be chosen from your semi-finalist picks.";
    }
  }

  if (!picks.winnerTeam?.trim()) {
    return "Pick a tournament winner.";
  }
  if (!picks.finalistTeams.includes(picks.winnerTeam)) {
    return "Champion must be one of your finalist picks.";
  }

  return null;
}

/** Keep later-round picks valid when an earlier round changes (ESPN-style bracket). */
export function reconcileCascadingPicks(
  semiFinalistTeams: string[],
  finalistTeams: string[],
  winnerTeam: string | null,
): { finalistTeams: string[]; winnerTeam: string | null } {
  const semiSet = new Set(semiFinalistTeams);
  const nextFinalists = finalistTeams.filter((t) => semiSet.has(t));
  const finalistSet = new Set(nextFinalists);
  const nextWinner =
    winnerTeam && finalistSet.has(winnerTeam) ? winnerTeam : null;
  return { finalistTeams: nextFinalists, winnerTeam: nextWinner };
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
