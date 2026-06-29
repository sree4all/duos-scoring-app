import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ROUND_OF_32_FIXTURES,
  fixtureTeamsMatch,
} from "@/lib/domain/world-cup/round-of-32-fixtures";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";

export type SyncRoundOf32Result = {
  matchesUpdated: number;
  eventsLockUpdated: number;
  eventTitlesUpdated: number;
  teamMismatches: { matchNumber: number; homeTeam: string; awayTeam: string }[];
};

/**
 * Apply official FIFA R32 UTC kickoffs (and team labels when needed).
 * Safe to run after CSV import — prevents Kaggle Eastern mis-parse of UTC values.
 */
export async function syncRoundOf32OfficialSchedule(
  supabase: SupabaseClient,
  seasonYear = 2026,
): Promise<SyncRoundOf32Result> {
  const teamMismatches: SyncRoundOf32Result["teamMismatches"] = [];
  let matchesUpdated = 0;
  let eventsLockUpdated = 0;
  let eventTitlesUpdated = 0;

  for (const fixture of ROUND_OF_32_FIXTURES) {
    const { data: row, error } = await supabase
      .from("matches")
      .select("id, home_team, away_team, match_time_utc, status")
      .eq("season_year", seasonYear)
      .eq("match_number", fixture.matchNumber)
      .maybeSingle();

    if (error) throw error;
    if (!row) continue;

    const home = row.home_team as string;
    const away = row.away_team as string;
    if (!fixtureTeamsMatch(home, away, fixture)) {
      teamMismatches.push({
        matchNumber: fixture.matchNumber,
        homeTeam: home,
        awayTeam: away,
      });
    }

    const needsTime =
      new Date(row.match_time_utc as string).getTime() !==
      new Date(fixture.kickoffUtc).getTime();
    const needsTeamRename = !fixtureTeamsMatch(home, away, fixture);

    if (needsTime || needsTeamRename) {
      const patch: Record<string, string> = { updated_at: new Date().toISOString() };
      if (needsTime) patch.match_time_utc = fixture.kickoffUtc;
      if (needsTeamRename) {
        patch.home_team = fixture.homeTeam;
        patch.away_team = fixture.awayTeam;
        patch.home_team_display = fixture.homeTeam;
        patch.away_team_display = fixture.awayTeam;
        patch.venue_label = fixture.venue;
      }
      const { error: upErr } = await supabase
        .from("matches")
        .update(patch)
        .eq("id", row.id as string);
      if (upErr) throw upErr;
      matchesUpdated++;
    }

    const { data: events, error: evErr } = await supabase
      .from("events")
      .select("id, lock_at, title")
      .eq("source_match_id", row.id as string);
    if (evErr) throw evErr;

    const title = buildLinkedMatchEventTitle(
      fixture.matchNumber,
      fixture.homeTeam,
      fixture.awayTeam,
    );

    for (const ev of events ?? []) {
      const lockMatches =
        new Date(ev.lock_at as string).getTime() ===
        new Date(fixture.kickoffUtc).getTime();
      const titleMatches = (ev.title as string) === title;

      if (lockMatches && titleMatches) continue;

      const patch: Record<string, string> = { updated_at: new Date().toISOString() };
      if (!lockMatches) patch.lock_at = fixture.kickoffUtc;
      if (!titleMatches) patch.title = title;

      const { error: evUpErr } = await supabase
        .from("events")
        .update(patch)
        .eq("id", ev.id as string);
      if (evUpErr) throw evUpErr;
      if (!lockMatches) eventsLockUpdated++;
      if (!titleMatches) eventTitlesUpdated++;
    }
  }

  return { matchesUpdated, eventsLockUpdated, eventTitlesUpdated, teamMismatches };
}
