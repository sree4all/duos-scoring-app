/**
 * Re-score all completed matches in a World Cup stage for every contest in a group.
 *
 *   npm run recalculate:wc-stage -- round_of_32 "Fix R32 -1 penalties"
 *   npm run recalculate:wc-stage -- round_of_32 "reason" <groupId>
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { recalculateStageScoring } from "@/lib/server/world-cup/recalculate-stage";
import { isWorldCupContest } from "@/lib/server/world-cup/resolve-group-contest";

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

async function main() {
  const stageKey = process.argv[2];
  const reason = process.argv[3];
  const groupFilter = process.argv[4];

  if (!stageKey || !reason?.trim()) {
    console.error(
      "Usage: npm run recalculate:wc-stage -- <stageKey> <reason> [groupId]",
    );
    process.exit(1);
  }
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = makeServiceClient();

  let contestQuery = supabase.from("contests").select("id, group_id, name, format_label");

  if (groupFilter) {
    contestQuery = contestQuery.eq("group_id", groupFilter);
  }

  const { data: contestRows, error } = await contestQuery;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const contests = (contestRows ?? []).filter((c) => isWorldCupContest(c));

  if (!contests?.length) {
    console.log("No World Cup contests found.");
    return;
  }

  for (const contest of contests) {
    const contestId = contest.id as string;
    const label = (contest.name as string) || contestId;
    const result = await recalculateStageScoring(
      supabase,
      contestId,
      stageKey,
      reason.trim(),
    );
    console.log(
      `${label}: rescored ${result.rescored} matches` +
        (result.errors.length ? ` (${result.errors.length} errors)` : ""),
    );
    for (const err of result.errors) {
      console.warn(`  ${err}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
