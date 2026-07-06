import { normMatchOutcome } from "@/lib/domain/world-cup/match-outcome";
import { teamMatchesFixtureName } from "@/lib/domain/world-cup/round-of-32-fixtures";
import type { AdvancedBracketPicks } from "@/lib/domain/world-cup/advanced-bracket";
import {
  FINAL_HALVES,
  R32_INITIAL_TEAMS,
  R32_MATCH_NUMBERS,
  SF_EXCLUSION_GROUPS,
  finalHalfForGroup,
  sfGroupIdForR32Match,
} from "@/lib/fifa/bracket-map";

export type MatchResultRow = {
  match_number: number | null;
  home_team: string;
  away_team: string;
  winner: string | null;
  status: string;
  tournament_stage?: string | null;
};

export type BracketState = {
  aliveTeams: Set<string>;
  eliminatedTeams: Set<string>;
};

export type SfExclusionGroupView = {
  group_id: string;
  teams: string[];
};

export type FinalHalfView = {
  half_id: string;
  teams: string[];
};

export type ForecastEligibility = {
  eligible_teams: string[];
  eliminated_teams: string[];
  sf_exclusion_groups: SfExclusionGroupView[];
  final_halves: FinalHalfView[];
};

function teamsMatch(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();
  if (!left || !right) return false;
  return (
    normMatchOutcome(left) === normMatchOutcome(right) ||
    teamMatchesFixtureName(left, right) ||
    teamMatchesFixtureName(right, left)
  );
}

function teamInSet(team: string, set: ReadonlySet<string>): boolean {
  if (set.has(team)) return true;
  for (const entry of set) {
    if (teamsMatch(entry, team)) return true;
  }
  return false;
}

function canonicalTeamName(team: string, alive: ReadonlySet<string>): string | null {
  for (const entry of alive) {
    if (teamsMatch(entry, team)) return entry;
  }
  return null;
}

/** Map a team name to its R32 FIFA match number (73–88). */
export function r32MatchForTeam(team: string): number | null {
  for (const mn of R32_MATCH_NUMBERS) {
    const initial = R32_INITIAL_TEAMS[mn] ?? [];
    if (initial.some((t) => teamsMatch(t, team))) return mn;
  }
  return null;
}

/** W97 / W98 / W99 / W100 group for an alive team, or null if eliminated/unknown. */
export function sfGroupForTeam(team: string, aliveTeams: ReadonlySet<string>): string | null {
  if (!teamInSet(team, aliveTeams)) return null;
  const r32 = r32MatchForTeam(team);
  if (r32 == null) return null;
  return sfGroupIdForR32Match(r32);
}

export function finalHalfForTeam(team: string, aliveTeams: ReadonlySet<string>): string | null {
  const gid = sfGroupForTeam(team, aliveTeams);
  return gid ? finalHalfForGroup(gid) : null;
}

export function computeBracketState(matches: MatchResultRow[]): BracketState {
  const alive = new Set<string>();
  const eliminated = new Set<string>();

  for (const mn of R32_MATCH_NUMBERS) {
    for (const t of R32_INITIAL_TEAMS[mn] ?? []) alive.add(t);
  }

  for (const m of matches) {
    const mn = m.match_number;
    if (mn == null || mn < 73 || mn > 96) continue;
    if (m.status !== "completed" || !m.winner?.trim()) continue;

    const winner = m.winner.trim();
    const home = m.home_team.trim();
    const away = m.away_team.trim();
    if (!teamsMatch(winner, home) && !teamsMatch(winner, away)) continue;

    const loser = teamsMatch(winner, home) ? away : home;
    const loserCanonical = canonicalTeamName(loser, alive) ?? loser;
    if (teamInSet(loserCanonical, alive)) {
      alive.delete(loserCanonical);
      eliminated.add(loserCanonical);
    }
  }

  return { aliveTeams: alive, eliminatedTeams: eliminated };
}

export function buildForecastEligibility(state: BracketState): ForecastEligibility {
  const sfGroups = SF_EXCLUSION_GROUPS.map((g) => ({
    group_id: g.group_id,
    teams: g.feeder_r32_match_numbers.flatMap(
      (mn) => R32_INITIAL_TEAMS[mn]?.filter((t) => teamInSet(t, state.aliveTeams)) ?? [],
    ),
  }));

  const finalHalves = FINAL_HALVES.map((h) => ({
    half_id: h.half_id,
    teams: h.sf_exclusion_group_ids.flatMap((gid) => {
      const g = sfGroups.find((x) => x.group_id === gid);
      return g?.teams ?? [];
    }),
  }));

  return {
    eligible_teams: [...state.aliveTeams].sort((a, b) => a.localeCompare(b)),
    eliminated_teams: [...state.eliminatedTeams].sort((a, b) => a.localeCompare(b)),
    sf_exclusion_groups: sfGroups,
    final_halves: finalHalves,
  };
}

export function buildForecastEligibilityFromMatches(
  matches: MatchResultRow[],
): ForecastEligibility {
  return buildForecastEligibility(computeBracketState(matches));
}

/** Semi-finalist pool: alive teams minus same W-group as an existing pick. */
export function visibleSemiFinalistTeams(
  eligibility: ForecastEligibility,
  selected: string[],
): string[] {
  const alive = new Set(eligibility.eligible_teams);
  const usedGroups = new Set<string>();

  for (const team of selected) {
    const gid = sfGroupForTeam(team, alive);
    if (gid) usedGroups.add(gid);
  }

  return eligibility.eligible_teams.filter((team) => {
    if (selected.includes(team)) return true;
    const gid = sfGroupForTeam(team, alive);
    if (!gid) return false;
    return !usedGroups.has(gid);
  });
}

/** Finalist pool: semi picks minus same bracket half as an existing finalist pick. */
export function visibleFinalistTeams(
  eligibility: ForecastEligibility,
  semiFinalists: string[],
  selectedFinalists: string[],
): string[] {
  const alive = new Set(eligibility.eligible_teams);
  const pool = semiFinalists.filter((t) => teamInSet(t, alive));

  if (selectedFinalists.length === 0) return pool;

  const anchor = selectedFinalists[0];
  const usedHalf = finalHalfForTeam(anchor, alive);
  if (!usedHalf) return pool;

  return pool.filter((team) => {
    if (selectedFinalists.includes(team)) return true;
    const half = finalHalfForTeam(team, alive);
    return half !== usedHalf;
  });
}

export type ForecastValidationError =
  | "INVALID_SEMI_FINALISTS"
  | "INVALID_FINALISTS"
  | "INVALID_WINNER"
  | "ELIMINATED_TEAM";

export function validateForecastAnswers(
  payload: AdvancedBracketPicks,
  state: BracketState,
): ForecastValidationError | null {
  const semi = payload.semiFinalistTeams;
  const final = payload.finalistTeams;
  const winner = payload.winnerTeam;

  const allPicked = [...semi, ...final, ...(winner ? [winner] : [])];
  for (const t of allPicked) {
    if (teamInSet(t, state.eliminatedTeams)) return "ELIMINATED_TEAM";
    if (!teamInSet(t, state.aliveTeams)) return "ELIMINATED_TEAM";
  }

  if (semi.length !== 4) return "INVALID_SEMI_FINALISTS";
  const semiSet = new Set(semi);
  if (semiSet.size !== 4) return "INVALID_SEMI_FINALISTS";

  const groupUsed = new Map<string, string>();
  for (const team of semi) {
    const gid = sfGroupForTeam(team, state.aliveTeams);
    if (!gid) return "INVALID_SEMI_FINALISTS";
    if (groupUsed.has(gid)) return "INVALID_SEMI_FINALISTS";
    groupUsed.set(gid, team);
  }

  if (final.length !== 2) return "INVALID_FINALISTS";
  const finalSet = new Set(final);
  if (finalSet.size !== 2) return "INVALID_FINALISTS";
  for (const t of final) {
    if (!semiSet.has(t)) return "INVALID_FINALISTS";
  }

  const halves = final.map((t) => finalHalfForTeam(t, state.aliveTeams));
  if (halves[0] === halves[1] || !halves[0] || !halves[1]) return "INVALID_FINALISTS";

  if (winner) {
    if (!finalSet.has(winner)) return "INVALID_WINNER";
  }

  return null;
}

export function forecastValidationErrorMessage(code: ForecastValidationError): string {
  switch (code) {
    case "ELIMINATED_TEAM":
      return "One or more picks include an eliminated team.";
    case "INVALID_SEMI_FINALISTS":
      return "Pick exactly 4 semi-finalists — at most one from each quarter-final path (W97, W98, W99, W100).";
    case "INVALID_FINALISTS":
      return "Pick 2 finalists from different bracket halves (left vs right).";
    case "INVALID_WINNER":
      return "Champion must be one of your finalist picks.";
    default:
      return "Invalid tournament forecast picks.";
  }
}
