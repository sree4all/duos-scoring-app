/**
 * FIFA World Cup 2026 Round of 32 — official match numbers, teams, venues, and
 * kickoff UTC (FIFA scores & fixtures / official schedule).
 */
export type RoundOf32Fixture = {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  /** ISO-8601 UTC kickoff stored in matches.match_time_utc */
  kickoffUtc: string;
};

export const ROUND_OF_32_FIXTURES: readonly RoundOf32Fixture[] = [
  {
    matchNumber: 73,
    homeTeam: "South Africa",
    awayTeam: "Canada",
    venue: "Los Angeles — SoFi Stadium",
    kickoffUtc: "2026-06-28T19:00:00.000Z",
  },
  {
    matchNumber: 76,
    homeTeam: "Brazil",
    awayTeam: "Japan",
    venue: "Houston — NRG Stadium",
    kickoffUtc: "2026-06-29T17:00:00.000Z",
  },
  {
    matchNumber: 74,
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    venue: "Boston — Gillette Stadium",
    kickoffUtc: "2026-06-29T20:30:00.000Z",
  },
  {
    matchNumber: 75,
    homeTeam: "Netherlands",
    awayTeam: "Morocco",
    venue: "Monterrey — Estadio BBVA",
    kickoffUtc: "2026-06-30T01:00:00.000Z",
  },
  {
    matchNumber: 78,
    homeTeam: "Ivory Coast",
    awayTeam: "Norway",
    venue: "Dallas — AT&T Stadium",
    kickoffUtc: "2026-06-30T17:00:00.000Z",
  },
  {
    matchNumber: 77,
    homeTeam: "France",
    awayTeam: "Sweden",
    venue: "New York / New Jersey — MetLife Stadium",
    kickoffUtc: "2026-06-30T21:00:00.000Z",
  },
  {
    matchNumber: 79,
    homeTeam: "Mexico",
    awayTeam: "Ecuador",
    venue: "Mexico City — Estadio Azteca",
    kickoffUtc: "2026-07-01T01:00:00.000Z",
  },
  {
    matchNumber: 80,
    homeTeam: "England",
    awayTeam: "DR Congo",
    venue: "Atlanta — Mercedes-Benz Stadium",
    kickoffUtc: "2026-07-01T16:00:00.000Z",
  },
  {
    matchNumber: 82,
    homeTeam: "Belgium",
    awayTeam: "Senegal",
    venue: "Seattle — Lumen Field",
    kickoffUtc: "2026-07-01T20:00:00.000Z",
  },
  {
    matchNumber: 81,
    homeTeam: "USA",
    awayTeam: "Bosnia and Herzegovina",
    venue: "San Francisco Bay Area — Levi's Stadium",
    kickoffUtc: "2026-07-02T00:00:00.000Z",
  },
  {
    matchNumber: 84,
    homeTeam: "Spain",
    awayTeam: "Austria",
    venue: "Los Angeles — SoFi Stadium",
    kickoffUtc: "2026-07-02T19:00:00.000Z",
  },
  {
    matchNumber: 83,
    homeTeam: "Portugal",
    awayTeam: "Croatia",
    venue: "Toronto — BMO Field",
    kickoffUtc: "2026-07-02T23:00:00.000Z",
  },
  {
    matchNumber: 85,
    homeTeam: "Switzerland",
    awayTeam: "Algeria",
    venue: "Vancouver — BC Place",
    kickoffUtc: "2026-07-03T03:00:00.000Z",
  },
  {
    matchNumber: 88,
    homeTeam: "Australia",
    awayTeam: "Egypt",
    venue: "Dallas — AT&T Stadium",
    kickoffUtc: "2026-07-03T18:00:00.000Z",
  },
  {
    matchNumber: 86,
    homeTeam: "Argentina",
    awayTeam: "Cape Verde",
    venue: "Miami — Hard Rock Stadium",
    kickoffUtc: "2026-07-03T22:00:00.000Z",
  },
  {
    matchNumber: 87,
    homeTeam: "Colombia",
    awayTeam: "Ghana",
    venue: "Kansas City — Arrowhead Stadium",
    kickoffUtc: "2026-07-04T01:30:00.000Z",
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
  return ROUND_OF_32_FIXTURES.find((f) => f.matchNumber === matchNumber)?.kickoffUtc;
}

export function teamMatchesFixtureName(actual: string, canonical: string): boolean {
  const aliases = ROUND_OF_32_TEAM_ALIASES[canonical] ?? [canonical];
  const norm = (s: string) => s.trim().toLowerCase();
  const a = norm(actual);
  return aliases.some((alias) => norm(alias) === a);
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
