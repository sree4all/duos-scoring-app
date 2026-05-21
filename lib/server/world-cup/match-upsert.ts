import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedMatch, ParsedTeam, ParsedCity, ParsedStage } from "@/lib/server/world-cup/csv-parsers";

export type MatchUpsertResult = { created: number; updated: number };

export async function upsertWorldCupMatches(
  supabase: SupabaseClient,
  matches: ParsedMatch[],
  teamsById: Map<string, ParsedTeam>,
  citiesById: Map<string, ParsedCity>,
  stagesById: Map<string, ParsedStage>,
  datasetVersion: string,
): Promise<MatchUpsertResult> {
  let created = 0;
  let updated = 0;

  for (const m of matches) {
    if (!m.matchNumber) continue;
    const stage = stagesById.get(m.stageId);
    const home = teamsById.get(m.homeTeamId);
    const away = teamsById.get(m.awayTeamId);
    const city = citiesById.get(m.cityId);
    const externalKey = `wc2026:m${m.matchNumber}`;

    const { data: existing } = await supabase
      .from("matches")
      .select("id, status")
      .eq("external_key", externalKey)
      .maybeSingle();

    const row = {
      external_key: externalKey,
      match_number: m.matchNumber,
      season_year: 2026,
      stage_key: stage?.stageKey ?? null,
      match_time_utc: m.kickoffAt,
      home_team: home?.name ?? "TBD",
      away_team: away?.name ?? "TBD",
      home_team_display: home?.name ?? "TBD",
      away_team_display: away?.name ?? "TBD",
      external_team_home_id: m.homeTeamId,
      external_team_away_id: m.awayTeamId,
      venue_label: city ? `${city.cityLabel} — ${city.venueName}` : null,
      dataset_version: datasetVersion,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      if (existing.status === "completed") {
        const { error } = await supabase
          .from("matches")
          .update({
            match_time_utc: row.match_time_utc,
            home_team: row.home_team,
            away_team: row.away_team,
            home_team_display: row.home_team_display,
            away_team_display: row.away_team_display,
            venue_label: row.venue_label,
            dataset_version: datasetVersion,
            updated_at: row.updated_at,
          })
          .eq("id", existing.id as string);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("matches").update(row).eq("id", existing.id as string);
        if (error) throw error;
      }
      updated++;
    } else {
      const { error } = await supabase.from("matches").insert({
        ...row,
        status: "scheduled",
      });
      if (error) throw error;
      created++;
    }
  }

  return { created, updated };
}
