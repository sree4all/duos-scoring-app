/**
 * Score one (or all ready) tournament-forecast phases for a contest.
 *
 * Usage:
 *   npx tsx scripts/score-advanced-bracket-phase.ts <contestId> winner
 *   npx tsx scripts/score-advanced-bracket-phase.ts <contestId> ready
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { AdvancedBracketScoringPhase } from "@/lib/domain/world-cup/advanced-bracket";
import {
  applyAdvancedBracketScoring,
  scoreReadyAdvancedBracketPhases,
} from "@/lib/server/world-cup/advanced-bracket-service";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const contestId = process.argv[2];
const phaseArg = process.argv[3] ?? "ready";

if (!contestId) {
  console.error(
    "Usage: npx tsx scripts/score-advanced-bracket-phase.ts <contestId> [semi_finalists|finalists|winner|ready]",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  if (phaseArg === "ready") {
    const results = await scoreReadyAdvancedBracketPhases(supabase, contestId);
    for (const r of results) {
      console.log(r.phase, r.outcome);
    }
    if (results.length === 0) {
      console.log("No ready forecast phases to score.");
    }
    return;
  }

  const phase = phaseArg as AdvancedBracketScoringPhase;
  if (!["semi_finalists", "finalists", "winner"].includes(phase)) {
    console.error(`Unknown phase: ${phaseArg}`);
    process.exit(1);
  }

  const outcome = await applyAdvancedBracketScoring(supabase, contestId, phase);
  console.log(outcome);
  if (!outcome.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
