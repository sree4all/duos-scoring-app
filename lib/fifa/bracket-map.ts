import { KNOCKOUT_FEEDERS } from "@/lib/domain/world-cup/knockout-bracket";
import { ROUND_OF_32_FIXTURES } from "@/lib/domain/world-cup/round-of-32-fixtures";

/** Quarter-final match numbers — each produces one semi-finalist (W97–W100). */
export const SF_SOURCE_MATCH_NUMBERS = [97, 98, 99, 100] as const;

export const R32_MATCH_NUMBERS = ROUND_OF_32_FIXTURES.map((f) => f.matchNumber);

/** Initial R32 participants keyed by FIFA match number (73–88). */
export const R32_INITIAL_TEAMS: Record<number, readonly string[]> = Object.fromEntries(
  ROUND_OF_32_FIXTURES.map((f) => [f.matchNumber, [f.homeTeam, f.awayTeam] as const]),
);

function r32FeedersForKnockoutMatch(matchNumber: number): number[] {
  if (matchNumber <= 88) return [matchNumber];
  const feeders = KNOCKOUT_FEEDERS[matchNumber];
  if (!feeders) return [];
  return [
    ...r32FeedersForKnockoutMatch(feeders[0]),
    ...r32FeedersForKnockoutMatch(feeders[1]),
  ];
}

/** One semi-finalist slot per QF path (W97, W98, W99, W100). */
export const SF_EXCLUSION_GROUPS = SF_SOURCE_MATCH_NUMBERS.map((mn) => ({
  group_id: `W${mn}`,
  source_match_number: mn,
  feeder_r32_match_numbers: r32FeedersForKnockoutMatch(mn),
}));

/** Bracket halves for the final — one finalist per half. */
export const FINAL_HALVES = [
  {
    half_id: "left",
    sf_exclusion_group_ids: ["W97", "W98"],
  },
  {
    half_id: "right",
    sf_exclusion_group_ids: ["W99", "W100"],
  },
] as const;

export function finalHalfForGroup(groupId: string): string | null {
  for (const half of FINAL_HALVES) {
    if ((half.sf_exclusion_group_ids as readonly string[]).includes(groupId)) {
      return half.half_id;
    }
  }
  return null;
}

export function sfGroupIdForR32Match(r32MatchNumber: number): string | null {
  for (const group of SF_EXCLUSION_GROUPS) {
    if (group.feeder_r32_match_numbers.includes(r32MatchNumber)) {
      return group.group_id;
    }
  }
  return null;
}
