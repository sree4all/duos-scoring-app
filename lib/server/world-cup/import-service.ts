import type { SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import type { WorldCupImportSummary } from "@/lib/domain/world-cup/types";
import {
  parseTeamsCsvContent,
  parseCitiesCsvContent,
  parseStagesCsvContent,
  parseMatchesCsvContent,
} from "@/lib/server/world-cup/csv-parsers";
import { upsertWorldCupMatches } from "@/lib/server/world-cup/match-upsert";
import { linkContestEventsFromMatches } from "@/lib/server/world-cup/event-linker";
import { seedDefaultStageRules } from "@/lib/server/world-cup/seed-stage-rules";

const DATASET_SLUG = "areezvisram12/fifa-world-cup-2026-match-data-unofficial";

export type WorldCupCsvUpload = {
  teams: string;
  cities: string;
  stages: string;
  matches: string;
};

const DISK_FILE_NAMES: Record<keyof WorldCupCsvUpload, string> = {
  teams: "teams.csv",
  cities: "host_cities.csv",
  stages: "tournament_stages.csv",
  matches: "matches.csv",
};

function parseUploadedCsvs(upload: WorldCupCsvUpload) {
  return {
    teams: parseTeamsCsvContent(upload.teams),
    cities: parseCitiesCsvContent(upload.cities),
    stages: parseStagesCsvContent(upload.stages),
    matches: parseMatchesCsvContent(upload.matches),
  };
}

function loadCsvUploadFromDisk(dataDir: string): WorldCupCsvUpload | null {
  const upload: Partial<WorldCupCsvUpload> = {};
  const missing: string[] = [];

  for (const [key, fileName] of Object.entries(DISK_FILE_NAMES)) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      missing.push(key);
      continue;
    }
    upload[key as keyof WorldCupCsvUpload] = fs.readFileSync(filePath, "utf8");
  }

  if (missing.length > 0) {
    return null;
  }

  return upload as WorldCupCsvUpload;
}

export async function runWorldCupImport(
  supabase: SupabaseClient,
  groupId: string,
  contestId: string,
  options?: { dataDir?: string; csvUpload?: WorldCupCsvUpload },
): Promise<WorldCupImportSummary> {
  const summary: WorldCupImportSummary = {
    matchesCreated: 0,
    matchesUpdated: 0,
    eventsLinked: 0,
    teamsResolved: 0,
    errors: [],
  };

  let upload = options?.csvUpload;
  if (!upload) {
    const dataDir = options?.dataDir ?? path.join(process.cwd(), "data", "worldcup-2026");
    upload = loadCsvUploadFromDisk(dataDir) ?? undefined;
    if (!upload) {
      for (const [key, fileName] of Object.entries(DISK_FILE_NAMES)) {
        const filePath = path.join(dataDir, fileName);
        if (!fs.existsSync(filePath)) {
          summary.errors.push(`Missing file: ${key} (${filePath})`);
        }
      }
      if (summary.errors.length === 0) {
        summary.errors.push("Could not read CSV files from disk.");
      } else {
        summary.errors.push(
          "On hosted deployments (Vercel), upload the four CSV files in the import form instead of using data/worldcup-2026/ on the server.",
        );
      }
      return summary;
    }
  }

  const required: (keyof WorldCupCsvUpload)[] = ["teams", "cities", "stages", "matches"];
  for (const key of required) {
    if (!upload[key]?.trim()) {
      summary.errors.push(`Missing CSV content: ${key}`);
    }
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
    const { teams, cities, stages, matches } = parseUploadedCsvs(upload);

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
    const msg =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Import failed";
    summary.errors.push(msg);
    await supabase
      .from("worldcup_import_runs")
      .update({ status: "failed", error_log: { message: msg } })
      .eq("id", runRow.id as string);
  }

  return summary;
}
