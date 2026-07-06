import { isPlaceholderTeam } from "@/lib/domain/world-cup/advanced-bracket";
import { normMatchOutcome } from "@/lib/domain/world-cup/match-outcome";
import {
  ROUND_OF_32_FIXTURES,
  teamMatchesFixtureName,
} from "@/lib/domain/world-cup/round-of-32-fixtures";
import {
  buildKnockoutBracket,
  isKnownKnockoutMatchup,
  parentMatchSlotTargets,
  PRE_SEMI_KNOCKOUT_MATCHES,
  type KnockoutBracket,
  type KnockoutFixture,
} from "@/lib/domain/world-cup/knockout-bracket";

export type KnockoutMatchState = {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  winner: string | null;
  status: string;
};

type SlotPair = { home: string; away: string };

function normalizeTeamName(name: string): string {
  return name.trim();
}

function teamsMatch(a: string, b: string): boolean {
  const left = normalizeTeamName(a);
  const right = normalizeTeamName(b);
  if (!left || !right) return false;
  return (
    normMatchOutcome(left) === normMatchOutcome(right) ||
    teamMatchesFixtureName(left, right) ||
    teamMatchesFixtureName(right, left)
  );
}

function resolvedWinner(row: KnockoutMatchState): string | null {
  const winner = normalizeTeamName(row.winner ?? "");
  if (row.status === "completed" && winner && !isPlaceholderTeam(winner)) return winner;
  return null;
}

function slotPairFromRow(row: KnockoutMatchState): SlotPair | null {
  const home = normalizeTeamName(row.homeTeam);
  const away = normalizeTeamName(row.awayTeam);
  const winner = resolvedWinner(row);
  if (winner) return { home: winner, away: winner };
  if (isPlaceholderTeam(home) || isPlaceholderTeam(away)) return null;
  return { home, away };
}

function slotPairToFixture(matchNumber: number, pair: SlotPair): KnockoutFixture | null {
  const home = pair.home.trim();
  const away = pair.away.trim();
  if (!home || !away) return null;
  if (isPlaceholderTeam(home) || isPlaceholderTeam(away)) return null;
  return { matchNumber, homeTeam: home, awayTeam: away };
}

function applyWinnerToParents(
  slots: Map<number, SlotPair>,
  sourceMatchNumber: number,
  winner: string,
) {
  for (const target of parentMatchSlotTargets(sourceMatchNumber)) {
    const current = slots.get(target.targetMatchNumber) ?? { home: "", away: "" };
    if (target.slot === "home") current.home = winner;
    else current.away = winner;
    slots.set(target.targetMatchNumber, current);
  }
}

/**
 * Build an effective knockout bracket for path-conflict UI rules.
 * Seeds R32 from the official fixture list, overlays DB rows, and propagates
 * completed winners into downstream R16/QF slots (FIFA bracket structure).
 */
export function buildEffectiveKnockoutFixtures(
  dbRows: KnockoutMatchState[],
): KnockoutFixture[] {
  const dbByNumber = new Map(dbRows.map((row) => [row.matchNumber, row]));
  const slots = new Map<number, SlotPair>();

  for (const fixture of ROUND_OF_32_FIXTURES) {
    const dbRow = dbByNumber.get(fixture.matchNumber);
    const fromDb = dbRow ? slotPairFromRow(dbRow) : null;
    slots.set(
      fixture.matchNumber,
      fromDb ?? { home: fixture.homeTeam, away: fixture.awayTeam },
    );
  }

  for (const matchNumber of PRE_SEMI_KNOCKOUT_MATCHES) {
    if (matchNumber <= 88) continue;
    const dbRow = dbByNumber.get(matchNumber);
    const fromDb = dbRow ? slotPairFromRow(dbRow) : null;
    if (fromDb) slots.set(matchNumber, fromDb);
  }

  const completed = [...dbRows]
    .filter((row) => resolvedWinner(row))
    .sort((a, b) => a.matchNumber - b.matchNumber);

  for (const row of completed) {
    const winner = resolvedWinner(row)!;
    slots.set(row.matchNumber, { home: winner, away: winner });
    applyWinnerToParents(slots, row.matchNumber, winner);
  }

  const fixtures: KnockoutFixture[] = [];
  for (const matchNumber of PRE_SEMI_KNOCKOUT_MATCHES) {
    const pair = slots.get(matchNumber);
    if (!pair) continue;
    const fixture = slotPairToFixture(matchNumber, pair);
    if (fixture && (isKnownKnockoutMatchup(fixture) || pair.home === pair.away)) {
      fixtures.push(fixture);
    }
  }

  return fixtures;
}

export function buildEffectiveKnockoutBracket(dbRows: KnockoutMatchState[]): KnockoutBracket {
  return buildKnockoutBracket(buildEffectiveKnockoutFixtures(dbRows));
}

/** Teams still alive in the knockout bracket (excludes known losers). */
export function activeTeamsFromKnockoutFixtures(
  fixtures: KnockoutFixture[],
  eliminated: ReadonlySet<string>,
): string[] {
  const teams = new Set<string>();
  for (const fixture of fixtures) {
    for (const team of [fixture.homeTeam, fixture.awayTeam]) {
      const name = team.trim();
      if (!name || isPlaceholderTeam(name)) continue;
      if (eliminated.has(name)) continue;
      if ([...eliminated].some((e) => teamsMatch(e, name))) continue;
      teams.add(name);
    }
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}
