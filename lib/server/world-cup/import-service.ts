import type { SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import type { WorldCupImportSummary } from "@/lib/domain/world-cup/types";
import {
  parseTeamsCsv,
  parseCitiesCsv,
  parseStagesCsv,
  parseMatchesCsv,
} from "@/lib/server/world-cup/csv-parsers";
import { upsertWorldCupMatches } from "@/lib/server/world-cup/match-upsert";
import { linkContestEventsFromMatches } from "@/lib/server/world-cup/event-linker";
import { seedDefaultStageRules } from "@/lib/server/world-cup/seed-stage-rules";

const DATASET_SLUG = "areezvisram12/fifa-world-cup-2026-match-data-unofficial";

export async function runWorldCupImport(
  supabase: SupabaseClient,
  groupId: string,
  contestId: string,
  dataDir = path.join(process.cwd(), "data", "worldcup-2026"),
): Promise<WorldCupImportSummary> {
  const summary: WorldCupImportSummary = {
    matchesCreated: 0,
    matchesUpdated: 0,
    eventsLinked: 0,
    teamsResolved: 0,
    errors: [],
  };

  const files = {
    teams: path.join(dataDir, "teams.csv"),
    cities: path.join(dataDir, "host_cities.csv"),
    stages: path.join(dataDir, "tournament_stages.csv"),
    matches: path.join(dataDir, "matches.csv"),
  };

  for (const [k, f] of Object.entries(files)) {
    if (!fs.existsSync(f)) summary.errors.push(`Missing file: ${k} (${f})`);
  }
  if (summary.errors.length) return summary;

  const { data: runRow, error: runErr } = await supabase
    .from("worldcup_import_runs")
    .insert({
      group_id: groupId,
      contest_id: contestId,
      dataset_slug: DATASET_SLUG,
      status: "running",
      row_counts: {},
    })
    .select("id")
    .single();
  if (runErr) throw runErr;

  try {
    const teams = parseTeamsCsv(files.teams);
    const cities = parseCitiesCsv(files.cities);
    const stages = parseStagesCsv(files.stages);
    const matches = parseMatchesCsv(files.matches);

    const teamsById = new Map(teams.map((t) => [t.id, t]));
    const citiesById = new Map(cities.map((c) => [c.id, c]));
    const stagesById = new Map(stages.map((s) => [s.id, s]));

    summary.teamsResolved = teams.length;
    const version = new Date().toISOString();
    const upsert = await upsertWorldCupMatches(
      supabase,
      matches,
      teamsById,
      citiesById,
      stagesById,
      version,
    );
    summary.matchesCreated = upsert.created;
    summary.matchesUpdated = upsert.updated;

    await seedDefaultStageRules(supabase, contestId, groupId);
    summary.eventsLinked = await linkContestEventsFromMatches(supabase, contestId);

    await supabase
      .from("worldcup_import_runs")
      .update({
        status: "success",
        dataset_version: version,
        row_counts: {
          matches: matches.length,
          teams: teams.length,
          cities: cities.length,
          stages: stages.length,
          events: summary.eventsLinked,
        },
      })
      .eq("id", runRow.id as string);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    summary.errors.push(msg);
    await supabase
      .from("worldcup_import_runs")
      .update({ status: "failed", error_log: { message: msg } })
      .eq("id", runRow.id as string);
  }

  return summary;
}
