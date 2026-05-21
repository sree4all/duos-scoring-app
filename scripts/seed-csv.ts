/**
 * Operator seed script for generalized runtime.
 *
 * Usage:
 *   npm run seed -- matches ./matches.csv
 *   npm run seed -- profiles ./profiles.csv
 *   npm run seed:demo
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { applyMatchScoring } from "@/lib/scoring/match-scoring";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeServiceClient(): SupabaseClient {
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

function normalizeRowKeys(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const keyName = k.trim();
    if (!keyName) continue;
    out[keyName] = typeof v === "string" ? v.trim() : String(v ?? "").trim();
  }
  return out;
}

function parseGmtCellToIsoUtc(cell: string): string {
  const s = cell.trim();
  if (!s) throw new Error("empty");
  const isoTry = new Date(s);
  if (!Number.isNaN(isoTry.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return isoTry.toISOString();
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (!m) throw new Error(`unrecognized datetime: ${s}`);
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const hh = Number(m[4]);
  const mi = Number(m[5]);
  const ss = Number(m[6]);
  return new Date(Date.UTC(y, mo - 1, d, hh, mi, ss)).toISOString();
}

function parseIstDateTimeToIsoUtc(dateCell: string, timeCell: string): string {
  const d = dateCell.trim();
  const t = timeCell.trim();
  const mDate = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const mTime = t.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!mDate || !mTime) throw new Error(`bad IST date/time: "${dateCell}" "${timeCell}"`);
  const day = Number(mDate[1]);
  const month = Number(mDate[2]);
  const year = Number(mDate[3]);
  const hour = Number(mTime[1]);
  const minute = Number(mTime[2]);
  const second = Number(mTime[3] ?? "0");
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - istOffsetMs).toISOString();
}

function mapRowToMatchPayload(r: Record<string, string>) {
  const row = normalizeRowKeys(r);
  const external_key = (row.external_key ?? row.match_number ?? "").trim();
  const home_team = (row.home_team ?? row.team_home ?? "").trim();
  const away_team = (row.away_team ?? row.team_away ?? "").trim();
  if (!external_key || !home_team || !away_team) return null;

  let match_time_utc: string;
  try {
    const dateCell = (row.match_date ?? "").trim();
    const timeCell = (row.match_time ?? "").trim();
    if (dateCell && timeCell) {
      match_time_utc = parseIstDateTimeToIsoUtc(dateCell, timeCell);
    } else {
      const gmtCell = (row["GMT Match Time"] ?? row.match_time_utc ?? "").trim();
      if (!gmtCell) return null;
      match_time_utc = parseGmtCellToIsoUtc(gmtCell);
    }
  } catch {
    return null;
  }

  const ms = (row.match_status ?? row.status ?? "").toUpperCase();
  const winnerRaw = (row.result_winner ?? row.winner ?? "").trim();
  const bonusRaw = (row.result_bonus ?? row.bonus_result ?? "").trim();

  let status = "scheduled";
  if (/ABANDON/i.test(winnerRaw) || /ABANDON/i.test(ms)) status = "abandoned";
  else if (/CANCEL/i.test(ms)) status = "cancelled";
  else if (/COMPLET/i.test(ms)) status = "completed";

  let winner: string | null =
    status === "completed" && winnerRaw && !/ABANDON/i.test(winnerRaw) ? winnerRaw : null;
  if (winner) {
    const draw = /^(draw|tie)$/i.test(winner.trim());
    if (draw) winner = "Draw";
  }
  const bonus_result = status === "completed" && bonusRaw ? bonusRaw : null;

  return { external_key, home_team, away_team, match_time_utc, status, winner, bonus_result };
}

async function seedMatchesWithClient(supabase: SupabaseClient, file: string) {
  const raw = fs.readFileSync(file, "utf8");
  const firstLine = raw.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const delimiter = detectDelimiter(firstLine);

  const rows = parse(raw, {
    columns: (headers: string[]) => headers.map((h) => String(h).trim()),
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  let ok = 0;
  for (const r of rows) {
    const payload = mapRowToMatchPayload(r);
    if (!payload) continue;

    const { error } = await supabase.from("matches").upsert(
      { ...payload, updated_at: new Date().toISOString() },
      { onConflict: "external_key" },
    );
    if (error) {
      console.error("Upsert error:", payload.external_key, error.message);
      continue;
    }
    ok += 1;

    if (payload.status === "completed") {
      const { data: mRow } = await supabase
        .from("matches")
        .select("id")
        .eq("external_key", payload.external_key)
        .maybeSingle();
      if (mRow?.id) {
        await applyMatchScoring(supabase, String(mRow.id), 2026);
      }
    }
  }

  console.log(`Matches: upserted ${ok} rows from ${file}.`);
}

async function seedProfiles(file: string) {
  const raw = fs.readFileSync(file, "utf8");
  const firstLine = raw.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows = parse(raw, {
    columns: (headers: string[]) => headers.map((h) => String(h).trim()),
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  const supabase = makeServiceClient();
  let ok = 0;

  for (const r of rows) {
    const row = normalizeRowKeys(r);
    const email = (row.email ?? row.Email ?? "").trim().toLowerCase();
    const display_name = row.display_name ?? row.name ?? row.participant ?? "";

    if (!email) continue;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: display_name || undefined, updated_at: new Date().toISOString() })
      .eq("email", email);

    if (!error) ok += 1;
  }

  console.log(`Profiles: attempted updates for ${ok} rows.`);
}

async function runDemoSeed() {
  const supabase = makeServiceClient();
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const samples = join(scriptDir, "samples");

  await seedMatchesWithClient(supabase, join(samples, "sample-matches.csv"));
  console.log("Demo seed finished.");
}

async function main() {
  const mode = process.argv[2];
  const file = process.argv[3];

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before seeding.");
    process.exit(1);
  }

  if (mode === "demo") {
    await runDemoSeed();
    return;
  }

  if (!mode || (!file && mode !== "demo")) {
    console.error('Usage: npm run seed -- matches|profiles <file> | npm run seed:demo');
    process.exit(1);
  }

  if (mode === "matches") {
    await seedMatchesWithClient(makeServiceClient(), file);
  } else if (mode === "profiles") {
    await seedProfiles(file);
  } else {
    console.error('First arg must be "matches", "profiles", or "demo".');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});