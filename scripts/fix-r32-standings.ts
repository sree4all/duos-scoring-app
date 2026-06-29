/**
 * One-shot production repair: fix R32 penalties, re-score, resync, print standings.
 * Run: npx tsx scripts/fix-r32-standings.ts
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { recalculateStageScoring } from "@/lib/server/world-cup/recalculate-stage";
import { resyncContestLedgerFromSeason } from "@/lib/server/world-cup/contest-ledger-mirror";
import type { ContestLeaderboardTotalsRow } from "@/lib/server/world-cup/contest-leaderboard";

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
  const { data: contests, error: cErr } = await supabase
    .from("contests")
    .select("id, name, group_id")
    .not("group_id", "is", null)
    .order("created_at", { ascending: true });

  if (cErr) throw cErr;

  const wc = (contests ?? []).find(
    (c) => (c.name as string)?.toLowerCase().includes("world cup") || true,
  );
  if (!wc) throw new Error("No group contest found");

  const contestId = wc.id as string;
  console.log(`Contest: ${wc.name} (${contestId})`);

  const { error: ruleErr } = await supabase
    .from("contest_stage_scoring_rules")
    .update({ incorrect_penalty: -1, updated_at: new Date().toISOString() })
    .eq("contest_id", contestId)
    .eq("stage_key", "round_of_32")
    .or("incorrect_penalty.is.null,incorrect_penalty.eq.0");

  if (ruleErr) console.warn("Rule patch:", ruleErr.message);
  else console.log("Patched round_of_32 incorrect_penalty to -1 where 0/null");

  const result = await recalculateStageScoring(
    supabase,
    contestId,
    "round_of_32",
    "fix_r32_standings_script",
  );
  console.log("Re-scored:", result);

  const resync = await resyncContestLedgerFromSeason(supabase, contestId);
  console.log("Resynced events:", resync.mirrored);

  const { data: rpcRows, error: rpcErr } = await supabase.rpc("contest_leaderboard_totals", {
    p_contest_id: contestId,
  });

  if (rpcErr) {
    console.warn(
      "RPC contest_leaderboard_totals unavailable — apply migration 202606300007:",
      rpcErr.message,
    );
  } else {
    const rows = (rpcRows ?? []) as ContestLeaderboardTotalsRow[];
    const ids = rows.map((r) => r.participant_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const names = new Map(
      (profiles ?? []).map((p) => [p.id as string, (p.display_name as string) ?? "?"]),
    );

    console.log("\n=== LEADERBOARD (season ledger) ===");
    for (const row of [...rows].sort(
      (a, b) => Number(b.total_points) - Number(a.total_points),
    )) {
      console.log(
        (names.get(row.participant_id) ?? row.participant_id).padEnd(22),
        Number(row.total_points),
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
