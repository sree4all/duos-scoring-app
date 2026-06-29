/**
 * Re-score one completed match and sync contest ledger (service role).
 * Run: npx tsx scripts/rescore-match.ts 73
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { applyMatchScoring } from "@/lib/scoring/match-scoring";
import { resyncContestLedgerFromSeason } from "@/lib/server/world-cup/contest-ledger-mirror";

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
    .select("id, status")
    .eq("season_year", 2026)
    .eq("match_number", matchNumber)
    .maybeSingle();

  if (mErr) throw mErr;
  if (!match) throw new Error(`Match ${matchNumber} not found`);
  if (match.status !== "completed") throw new Error(`Match ${matchNumber} is not completed`);

  const matchId = match.id as string;
  const { data: events } = await supabase
    .from("events")
    .select("contest_id")
    .eq("source_match_id", matchId)
    .eq("voided", false);

  const contestId = events?.[0]?.contest_id as string | undefined;
  const outcome = await applyMatchScoring(supabase, matchId, 2026, {
    contestId,
    stageKey: "round_of_32",
    auditReason: "rescore_match_script",
  });

  if (!outcome.ok) {
    console.error("Scoring failed:", outcome.error);
    process.exit(1);
  }

  console.log("Scored:", {
    matchNumber,
    ledgerRows: outcome.ledgerRows,
    stageKey: outcome.stageKey,
    missPenalty: outcome.missPenalty,
  });

  const contestIds = [...new Set((events ?? []).map((e) => e.contest_id as string))];
  for (const cid of contestIds) {
    const resync = await resyncContestLedgerFromSeason(supabase, cid);
    console.log(`Resynced contest ${cid}: ${resync.mirrored} events`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
