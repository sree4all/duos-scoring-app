import type { SupabaseClient } from "@supabase/supabase-js";
import { validateOfficialWinner } from "@/lib/domain/world-cup/match-outcome";
import { resolveEventStageKey } from "@/lib/server/world-cup/schedule-query";

export async function setMatchOfficialResult(
  supabase: SupabaseClient,
  contestId: string,
  matchId: string,
  winnerRaw: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, home_team, away_team, stage_key, status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchErr || !match) {
    return { ok: false, error: matchErr?.message ?? "Match not found." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("stage_key, source_match_id")
    .eq("contest_id", contestId)
    .eq("source_match_id", matchId)
    .maybeSingle();

  const stageKey = await resolveEventStageKey(supabase, {
    stage_key: (event?.stage_key as string | null) ?? null,
    source_match_id: matchId,
  });

  const homeTeam = match.home_team as string;
  const awayTeam = match.away_team as string;
  const validated = validateOfficialWinner(stageKey, winnerRaw, homeTeam, awayTeam);
  if (!validated.ok) return validated;

  const { error: updateErr } = await supabase
    .from("matches")
    .update({
      winner: validated.value,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true };
}
