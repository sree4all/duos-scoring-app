import { parse } from "csv-parse/sync";
import * as fs from "fs";
import type { StageKey } from "@/lib/domain/world-cup/types";
import { worldCupCopy } from "@/lib/copy/world-cup";

export type ParsedTeam = { id: string; name: string; groupLetter?: string };
export type ParsedCity = { id: string; venueName: string; cityLabel: string };
export type ParsedStage = { id: string; stageKey: StageKey; stageName: string; stageOrder: number };
export type ParsedMatch = {
  matchNumber: number;
  kickoffAt: string;
  homeTeamId: string;
  awayTeamId: string;
  cityId: string;
  stageId: string;
};

const STAGE_NAME_TO_KEY: Record<string, StageKey> = {
  "first stage (group stage)": "group_stage",
  "group stage": "group_stage",
  "round of 32": "round_of_32",
  "round of 16": "round_of_16",
  "quarter-finals": "quarter_finals",
  "quarter finals": "quarter_finals",
  "semi-finals": "semi_finals",
  "semi finals": "semi_finals",
  "third place playoff": "third_place",
  "third place play-off": "third_place",
  final: "final",
};

export function normalizeStageKey(stageName: string): StageKey {
  const k = stageName.trim().toLowerCase();
  return STAGE_NAME_TO_KEY[k] ?? "group_stage";
}

function readCsv(path: string): Record<string, string>[] {
  const raw = fs.readFileSync(path, "utf8");
  const firstLine = raw.split(/\r?\n/)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    trim: true,
  }) as Record<string, string>[];
}

export function parseTeamsCsv(path: string): ParsedTeam[] {
  return readCsv(path).map((row) => ({
    id: String(row.id ?? row.team_id ?? ""),
    name: worldCupCopy.placeholderTeam(String(row.name ?? row.team_name ?? "TBD")),
    groupLetter: row.group_letter ?? row.group ?? undefined,
  }));
}

export function parseCitiesCsv(path: string): ParsedCity[] {
  return readCsv(path).map((row) => ({
    id: String(row.id ?? row.city_id ?? ""),
    venueName: String(row.venue_name ?? ""),
    cityLabel: String(row.city ?? row.name ?? row.host_city ?? ""),
  }));
}

export function parseStagesCsv(path: string): ParsedStage[] {
  return readCsv(path).map((row) => {
    const stageName = String(row.stage_name ?? row.name ?? "");
    return {
      id: String(row.id ?? row.stage_id ?? ""),
      stageKey: normalizeStageKey(stageName),
      stageName,
      stageOrder: Number(row.stage_order ?? row.order ?? 0),
    };
  });
}

export function parseMatchesCsv(path: string): ParsedMatch[] {
  return readCsv(path).map((row) => ({
    matchNumber: Number(row.match_number ?? row.match_no ?? 0),
    kickoffAt: String(row.kickoff_at ?? row.match_time ?? ""),
    homeTeamId: String(row.home_team_id ?? ""),
    awayTeamId: String(row.away_team_id ?? ""),
    cityId: String(row.city_id ?? ""),
    stageId: String(row.stage_id ?? ""),
  }));
}
