import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";
import { defaultMatchLockAtIso } from "@/lib/utils/match-lock";

export async function linkContestEventsFromMatches(
  supabase: SupabaseClient,
  contestId: string,
  seasonYear = 2026,
): Promise<number> {
  const { data: matches, error: mErr } = await supabase
    .from("matches")
    .select("id, match_number, stage_key, match_time_utc, home_team, away_team")
    .eq("season_year", seasonYear)
    .not("match_number", "is", null)
    .order("match_number", { ascending: true });

  if (mErr) throw mErr;

  let linked = 0;
  for (const match of matches ?? []) {
    const matchId = match.id as string;
    const title = buildLinkedMatchEventTitle(
      match.match_number as number | null,
      match.home_team as string,
      match.away_team as string,
    );

    const kickoffUtc = match.match_time_utc as string;
    const defaultLockAt = defaultMatchLockAtIso(kickoffUtc);

    const { data: existing } = await supabase
      .from("events")
      .select("id, lock_at")
      .eq("contest_id", contestId)
      .eq("source_match_id", matchId)
      .maybeSingle();

    const existingLockAt = (existing?.lock_at as string | null) ?? null;
    const lockAt =
      existingLockAt &&
      new Date(existingLockAt).getTime() < new Date(defaultLockAt).getTime()
        ? existingLockAt
        : defaultLockAt;

    if (existing) {
      const { error } = await supabase
        .from("events")
        .update({
          title,
          stage_key: match.stage_key as string | null,
          lock_at: lockAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id as string);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("events").insert({
        contest_id: contestId,
        title,
        source_match_id: matchId,
        stage_key: match.stage_key as string | null,
        lock_at: defaultLockAt,
        state: "scheduled_open",
      });
      if (error) throw error;
    }
    linked++;
  }

  return linked;
}
