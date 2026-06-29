import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const nums = [77, 78, 86, 87];
  const { data: matches, error: mErr } = await supabase
    .from("matches")
    .select("id, match_number, external_key, home_team, away_team, match_time_utc")
    .eq("season_year", 2026)
    .in("match_number", nums)
    .order("match_number");
  if (mErr) throw mErr;

  console.log("=== MATCHES ===");
  for (const m of matches ?? []) console.log(m);

  const ids = (matches ?? []).map((m) => m.id as string);
  const { data: preds, error: pErr } = await supabase
    .from("predictions")
    .select("match_id, predicted_winner")
    .in("match_id", ids);
  if (pErr) throw pErr;

  console.log("\n=== PREDICTIONS ===");
  for (const m of matches ?? []) {
    const picks = (preds ?? []).filter((p) => p.match_id === m.id);
    const counts: Record<string, number> = {};
    for (const p of picks) {
      const w = p.predicted_winner as string;
      counts[w] = (counts[w] ?? 0) + 1;
    }
    console.log(
      `M${m.match_number} ${m.home_team} vs ${m.away_team}`,
      counts,
      `n=${picks.length}`,
    );
  }

  const { data: events, error: eErr } = await supabase
    .from("events")
    .select("id, title, source_match_id")
    .in("source_match_id", ids);
  if (eErr) throw eErr;

  console.log("\n=== EVENTS ===");
  for (const e of events ?? []) {
    const m = matches?.find((x) => x.id === e.source_match_id);
    console.log({
      title: e.title,
      match_number: m?.match_number,
      teams: m ? `${m.home_team} vs ${m.away_team}` : "?",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
