/**
 * Swap predictions between R32 match pairs whose teams were corrected on
 * match_number while users had already predicted against the old pairing.
 *
 * Usage: npx tsx scripts/swap-r32-crossed-predictions.ts [--apply]
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Pairs where fixture teams were on the wrong match_number before canonical sync. */
const SWAP_PAIRS: [number, number][] = [
  [77, 78],
  [86, 87],
];

async function getMatchId(matchNumber: number): Promise<string> {
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .eq("season_year", 2026)
    .eq("match_number", matchNumber)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error(`Match ${matchNumber} not found`);
  return data.id as string;
}

async function swapMatchIdRows(
  sb: SupabaseClient,
  table: "predictions" | "prediction_bonus_answers",
  idA: string,
  idB: string,
  apply: boolean,
): Promise<number> {
  const { data: rows, error } = await sb
    .from(table)
    .select("*")
    .in("match_id", [idA, idB]);
  if (error) throw error;
  const total = rows?.length ?? 0;
  if (!apply || total === 0) return total;

  const swapped = (rows ?? []).map((row) => {
    const matchId = row.match_id as string;
    return {
      ...row,
      match_id: matchId === idA ? idB : idA,
    };
  });

  const { error: delErr } = await sb.from(table).delete().in("match_id", [idA, idB]);
  if (delErr) throw delErr;

  const { error: insErr } = await sb.from(table).insert(swapped);
  if (insErr) throw insErr;

  return total;
}

async function main() {
  const apply = process.argv.includes("--apply");

  for (const [aNum, bNum] of SWAP_PAIRS) {
    const idA = await getMatchId(aNum);
    const idB = await getMatchId(bNum);
    console.log(`\nPair M${aNum} <-> M${bNum}`);

    const preds = await swapMatchIdRows(supabase, "predictions", idA, idB, false);
    const bonus = await swapMatchIdRows(supabase, "prediction_bonus_answers", idA, idB, false);

    console.log(apply ? "Swapping:" : "Would swap:", { preds, bonus });

    if (apply) {
      await swapMatchIdRows(supabase, "predictions", idA, idB, true);
      await swapMatchIdRows(supabase, "prediction_bonus_answers", idA, idB, true);
    }
  }

  if (!apply) console.log("\nDry run only. Re-run with --apply to swap.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
