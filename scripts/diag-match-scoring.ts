/**
 * Diagnose Match 73 (South Africa vs Canada) scoring parity per player.
 * Run: npx tsx scripts/diag-match-scoring.ts 73
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { resolveStagePointsFromDb } from "@/lib/scoring/stage-points";
import { normAnswer } from "@/lib/scoring/normalize";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const matchNumber = Number(process.argv[2] ?? 73);
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("id, match_number, home_team, away_team, winner, status, stage_key")
    .eq("season_year", 2026)
    .eq("match_number", matchNumber)
    .maybeSingle();

  if (mErr) throw mErr;
  if (!match) {
    console.error(`Match ${matchNumber} not found`);
    process.exit(1);
  }

  const matchId = match.id as string;
  console.log(`\n=== M${matchNumber}: ${match.home_team} vs ${match.away_team} ===`);
  console.log({
    status: match.status,
    winner: match.winner,
    stage_key: match.stage_key,
  });

  const { data: events } = await supabase
    .from("events")
    .select("id, contest_id, stage_key")
    .eq("source_match_id", matchId);

  for (const ev of events ?? []) {
    const contestId = ev.contest_id as string;
    const { data: rule } = await supabase
      .from("contest_stage_scoring_rules")
      .select("correct_points, incorrect_penalty")
      .eq("contest_id", contestId)
      .eq("stage_key", "round_of_32")
      .maybeSingle();

    const pts = resolveStagePointsFromDb(
      "round_of_32",
      rule?.correct_points as number | null,
      rule?.incorrect_penalty as number | null,
      2,
    );
    console.log(`\nContest ${contestId} R32 rule raw:`, rule);
    console.log("Resolved scoring points:", pts);
  }

  const { data: preds } = await supabase
    .from("predictions")
    .select("user_id, predicted_winner")
    .eq("match_id", matchId);

  const userIds = (preds ?? []).map((p) => p.user_id as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.display_name as string) ?? "?"]),
  );

  const { data: seasonLedger } = await supabase
    .from("points_ledger")
    .select("user_id, points_delta, reason")
    .eq("source_id", matchId)
    .eq("source_type", "match");

  const { data: contestLedger } = await supabase
    .from("contest_points_ledger")
    .select("participant_id, points_delta, action_type, contest_id")
    .in(
      "event_id",
      (events ?? []).map((e) => e.id as string).length
        ? (events ?? []).map((e) => e.id as string)
        : ["00000000-0000-0000-0000-000000000000"],
    );

  const winner = match.winner as string | null;
  const pts = resolveStagePointsFromDb("round_of_32", 3, 0, 2);

  console.log("\n=== PER PLAYER ===");
  console.log(
    "name".padEnd(22),
    "pick".padEnd(18),
    "expected".padStart(8),
    "season".padStart(8),
    "contest".padStart(8),
  );

  for (const p of preds ?? []) {
    const uid = p.user_id as string;
    const pick = (p.predicted_winner as string)?.trim() ?? "";
    let expected = "—";
    if (pick && winner) {
      const correct = normAnswer(pick) === normAnswer(winner);
      if (correct && pts.correct !== 0) expected = String(pts.correct);
      else if (!correct && pts.incorrect !== 0) expected = String(pts.incorrect);
      else expected = "0";
    }
    const season = (seasonLedger ?? [])
      .filter((r) => r.user_id === uid)
      .map((r) => `${r.points_delta}(${r.reason})`)
      .join(",") || "—";
    const contest = (contestLedger ?? [])
      .filter((r) => r.participant_id === uid)
      .map((r) => `${r.points_delta}(${r.action_type})`)
      .join(",") || "—";

    console.log(
      (nameById.get(uid) ?? uid.slice(0, 8)).padEnd(22),
      pick.padEnd(18),
      expected.padStart(8),
      season.padStart(8),
      contest.padStart(8),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
