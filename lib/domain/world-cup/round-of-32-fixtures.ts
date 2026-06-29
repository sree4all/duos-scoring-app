import { easternWallClockToIsoUtc } from "@/lib/utils/eastern-time";

/**
 * FIFA World Cup 2026 Round of 32 — official match numbers, teams, venues, and
 * US Eastern kickoffs (NBC Sports / FOX ET listings).
 *
 * Bracket slots: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
 * Resolved teams: post–group-stage results (June 2026).
 */
export type RoundOf32Fixture = {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoffDate: string;
  kickoffTimeEt: string;
};

export const ROUND_OF_32_FIXTURES: readonly RoundOf32Fixture[] = [
  {
    matchNumber: 73,
    homeTeam: "South Africa",
    awayTeam: "Canada",
    venue: "Los Angeles — SoFi Stadium",
    kickoffDate: "2026-06-28",
    kickoffTimeEt: "15:00:00",
  },
  {
    matchNumber: 74,
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    venue: "Boston — Gillette Stadium",
    kickoffDate: "2026-06-29",
    kickoffTimeEt: "16:30:00",
  },
  {
    matchNumber: 75,
    homeTeam: "Netherlands",
    awayTeam: "Morocco",
    venue: "Monterrey — Estadio BBVA",
    kickoffDate: "2026-06-29",
    kickoffTimeEt: "21:00:00",
  },
  {
    matchNumber: 76,
    homeTeam: "Brazil",
    awayTeam: "Japan",
    venue: "Houston — NRG Stadium",
    kickoffDate: "2026-06-29",
    kickoffTimeEt: "13:00:00",
  },
  {
    matchNumber: 77,
    homeTeam: "France",
    awayTeam: "Sweden",
    venue: "New York / New Jersey — MetLife Stadium",
    kickoffDate: "2026-06-30",
    kickoffTimeEt: "17:00:00",
  },
  {
    matchNumber: 78,
    homeTeam: "Ivory Coast",
    awayTeam: "Norway",
    venue: "Dallas — AT&T Stadium",
    kickoffDate: "2026-06-30",
    kickoffTimeEt: "13:00:00",
  },
  {
    matchNumber: 79,
    homeTeam: "Mexico",
    awayTeam: "Ecuador",
    venue: "Mexico City — Estadio Azteca",
    kickoffDate: "2026-06-30",
    kickoffTimeEt: "21:00:00",
  },
  {
    matchNumber: 80,
    homeTeam: "England",
    awayTeam: "DR Congo",
    venue: "Atlanta — Mercedes-Benz Stadium",
    kickoffDate: "2026-07-01",
    kickoffTimeEt: "12:00:00",
  },
  {
    matchNumber: 81,
    homeTeam: "USA",
    awayTeam: "Bosnia and Herzegovina",
    venue: "San Francisco Bay Area — Levi's Stadium",
    kickoffDate: "2026-07-01",
    kickoffTimeEt: "20:00:00",
  },
  {
    matchNumber: 82,
    homeTeam: "Belgium",
    awayTeam: "Senegal",
    venue: "Seattle — Lumen Field",
    kickoffDate: "2026-07-01",
    kickoffTimeEt: "16:00:00",
  },
  {
    matchNumber: 83,
    homeTeam: "Portugal",
    awayTeam: "Croatia",
    venue: "Toronto — BMO Field",
    kickoffDate: "2026-07-02",
    kickoffTimeEt: "19:00:00",
  },
  {
    matchNumber: 84,
    homeTeam: "Spain",
    awayTeam: "Austria",
    venue: "Los Angeles — SoFi Stadium",
    kickoffDate: "2026-07-02",
    kickoffTimeEt: "15:00:00",
  },
  {
    matchNumber: 85,
    homeTeam: "Switzerland",
    awayTeam: "Algeria",
    venue: "Vancouver — BC Place",
    kickoffDate: "2026-07-02",
    kickoffTimeEt: "23:00:00",
  },
  {
    matchNumber: 86,
    homeTeam: "Argentina",
    awayTeam: "Cape Verde",
    venue: "Miami — Hard Rock Stadium",
    kickoffDate: "2026-07-03",
    kickoffTimeEt: "18:00:00",
  },
  {
    matchNumber: 87,
    homeTeam: "Colombia",
    awayTeam: "Ghana",
    venue: "Kansas City — Arrowhead Stadium",
    kickoffDate: "2026-07-03",
    kickoffTimeEt: "21:30:00",
  },
  {
    matchNumber: 88,
    homeTeam: "Australia",
    awayTeam: "Egypt",
    venue: "Dallas — AT&T Stadium",
    kickoffDate: "2026-07-03",
    kickoffTimeEt: "14:00:00",
  },
] as const;

/** Accepted spellings for verification (group-stage import may vary). */
export const ROUND_OF_32_TEAM_ALIASES: Record<string, readonly string[]> = {
  "Ivory Coast": ["Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"],
  "DR Congo": ["DR Congo", "Congo DR", "Democratic Republic of Congo"],
  USA: ["USA", "United States", "US"],
  "Bosnia and Herzegovina": ["Bosnia and Herzegovina", "Bosnia"],
};

export function roundOf32KickoffUtc(matchNumber: number): string | undefined {
  const row = ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === matchNumber);
  if (!row) return undefined;
  return easternWallClockToIsoUtc(row.kickoffDate, row.kickoffTimeEt);
}

export function teamMatchesFixtureName(actual: string, canonical: string): boolean {
  const aliases = ROUND_OF_32_TEAM_ALIASES[canonical] ?? [canonical];
  const norm = (s: string) => s.trim().toLowerCase();
  const a = norm(actual);
  return aliases.some((alias) => norm(alias) === a || a.includes(norm(alias)));
}

export function fixtureTeamsMatch(
  homeTeam: string,
  awayTeam: string,
  fixture: RoundOf32Fixture,
): boolean {
  return (
    teamMatchesFixtureName(homeTeam, fixture.homeTeam) &&
    teamMatchesFixtureName(awayTeam, fixture.awayTeam)
  );
}
