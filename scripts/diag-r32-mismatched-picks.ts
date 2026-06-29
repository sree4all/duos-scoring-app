import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function teamsMatch(pick: string, home: string, away: string): boolean {
  const n = (s: string) => s.trim().toLowerCase();
  const p = n(pick);
  return n(home) === p || n(away) === p;
}

async function main() {
  const nums = [77, 78, 86, 87];
  const { data: matches } = await supabase
    .from("matches")
    .select("id, match_number, home_team, away_team, status, winner")
    .eq("season_year", 2026)
    .in("match_number", nums)
    .order("match_number");

  const ids = (matches ?? []).map((m) => m.id as string);
  const { data: preds } = await supabase
    .from("predictions")
    .select("id, match_id, predicted_winner")
    .in("match_id", ids);

  console.log("=== MISMATCHED PREDICTIONS ===");
  for (const m of matches ?? []) {
    const rows = (preds ?? []).filter((p) => p.match_id === m.id);
    const bad = rows.filter(
      (p) => !teamsMatch(p.predicted_winner as string, m.home_team as string, m.away_team as string),
    );
    if (bad.length === 0) continue;
    console.log(`M${m.match_number}: bad=${bad.length}/${rows.length}`);
  }

  const { count: baCount } = await supabase
    .from("prediction_bonus_answers")
    .select("id", { count: "exact", head: true })
    .in("match_id", ids);
  const { data: pl } = await supabase
    .from("points_ledger")
    .select("source_id, reason")
    .in("source_id", ids);
  const { data: cpl } = await supabase
    .from("contest_points_ledger")
    .select("source_id, reason")
    .in("source_id", ids);

  console.log("\nmatches status:", matches?.map((m) => ({ n: m.match_number, status: m.status, winner: m.winner })));
  console.log("bonus_answers count:", baCount ?? 0);
  console.log("points_ledger rows:", pl?.length ?? 0);
  console.log("contest_points_ledger rows:", cpl?.length ?? 0);
}

main();
