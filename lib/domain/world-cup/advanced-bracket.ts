import {
  forecastValidationErrorMessage,
  validateForecastAnswers,
  type BracketState,
} from "@/lib/domain/world-cup/forecast-eligibility";

export const ADVANCED_BRACKET_PICKS = {
  semiFinalists: 4,
  finalists: 2,
  winner: 1,
} as const;

/** Round of 16 fixture numbers (FIFA WC 2026). */
export const ROUND_OF_16_MATCH_NUMBER_MIN = 89;
export const ROUND_OF_16_MATCH_NUMBER_MAX = 96;

/** Tournament forecast locks July 6, 2026 3:00 PM ET (match 93 kickoff — Portugal vs Spain). */
export const ADVANCED_BRACKET_LOCK_FALLBACK_UTC = "2026-07-06T19:00:00.000Z";

/** FIFA match number whose kickoff is the tournament forecast deadline. */
export const ADVANCED_BRACKET_LOCK_MATCH_NUMBER = 93;

export const ADVANCED_BRACKET_POINTS = {
  semiFinalist: 10,
  finalist: 15,
  winner: 20,
} as const;

export type AdvancedBracketScoringPhase = "semi_finalists" | "finalists" | "winner";

export type AdvancedBracketPhaseReadiness = {
  phase: AdvancedBracketScoringPhase;
  ready: boolean;
  /** Derived official answer so the organizer can verify before scoring. */
  officialPreview: string[];
  blockedReason: string | null;
};

/**
 * Staged readiness for the three forecast questions:
 * semi-finalists are known once both semi-final fixtures are set (quarter-finals
 * done), finalists once both semi-finals are completed, champion once the
 * Final is completed.
 */
export function evaluatePhaseReadiness(input: {
  semiFinalistTeams: string[];
  semiFinalsCompleted: boolean;
  finalistTeams: string[];
  finalCompleted: boolean;
  winnerTeam: string | null;
}): AdvancedBracketPhaseReadiness[] {
  const semiKnown = input.semiFinalistTeams.length;
  const semiReady = semiKnown === ADVANCED_BRACKET_PICKS.semiFinalists;

  const finalistsReady =
    input.semiFinalsCompleted &&
    input.finalistTeams.length === ADVANCED_BRACKET_PICKS.finalists;

  const winnerReady = input.finalCompleted && Boolean(input.winnerTeam?.trim());

  return [
    {
      phase: "semi_finalists",
      ready: semiReady,
      officialPreview: input.semiFinalistTeams,
      blockedReason: semiReady
        ? null
        : `Waiting on quarter-final results — ${semiKnown} of ${ADVANCED_BRACKET_PICKS.semiFinalists} semi-finalists known.`,
    },
    {
      phase: "finalists",
      ready: finalistsReady,
      officialPreview: input.finalistTeams,
      blockedReason: finalistsReady
        ? null
        : "Waiting on semi-final results — finalists are known once both semi-finals are completed.",
    },
    {
      phase: "winner",
      ready: winnerReady,
      officialPreview: input.winnerTeam?.trim() ? [input.winnerTeam.trim()] : [],
      blockedReason: winnerReady ? null : "Waiting on the Final result.",
    },
  ];
}

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
  bracketState: BracketState,
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

  const forecastError = validateForecastAnswers(picks, bracketState);
  if (forecastError) return forecastValidationErrorMessage(forecastError);

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
