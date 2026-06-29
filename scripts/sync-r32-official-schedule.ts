/**
 * Verify / apply FIFA Round of 32 UTC schedule to matches + event locks.
 *
 * Usage: npx tsx scripts/sync-r32-official-schedule.ts
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { ROUND_OF_32_FIXTURES } from "@/lib/domain/world-cup/round-of-32-fixtures";
import { syncRoundOf32OfficialSchedule } from "@/lib/server/world-cup/sync-round-of-32-schedule";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("=== FIFA R32 schedule check ===\n");
  for (const f of ROUND_OF_32_FIXTURES) {
    const { data } = await supabase
      .from("matches")
      .select("home_team, away_team, match_time_utc")
      .eq("season_year", 2026)
      .eq("match_number", f.matchNumber)
      .maybeSingle();

    const dbUtc = data?.match_time_utc as string | undefined;
    const ok =
      dbUtc != null && new Date(dbUtc).toISOString() === new Date(f.kickoffUtc).toISOString();
    const et = dbUtc ? formatEasternDateTime(dbUtc) : "—";
    console.log(
      `${ok ? "OK" : "FIX"} M${f.matchNumber} ${f.homeTeam} vs ${f.awayTeam}`,
      `| FIFA UTC ${f.kickoffUtc}`,
      `| DB ${dbUtc ?? "missing"}`,
      `| ${et}`,
    );
  }

  const result = await syncRoundOf32OfficialSchedule(supabase);
  console.log("\nSync:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
