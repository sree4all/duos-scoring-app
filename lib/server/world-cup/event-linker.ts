import type { SupabaseClient } from "@supabase/supabase-js";

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
    const title = `Match ${match.match_number}: ${match.home_team} vs ${match.away_team}`;

    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("contest_id", contestId)
      .eq("source_match_id", matchId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("events")
        .update({
          title,
          stage_key: match.stage_key as string | null,
          lock_at: match.match_time_utc as string,
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
        lock_at: match.match_time_utc as string,
        state: "open",
      });
      if (error) throw error;
    }
    linked++;
  }

  return linked;
}
