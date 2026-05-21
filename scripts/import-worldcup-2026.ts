/**
 * Import FIFA World Cup 2026 CSVs into matches + contest events.
 *
 * Usage:
 *   npm run import:worldcup -- --group-id <uuid> --contest-id <uuid>
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { runWorldCupImport } from "@/lib/server/world-cup/import-service";

for (const name of [".env", ".env.local"] as const) {
  loadEnv({ path: resolve(process.cwd(), name), override: name === ".env.local" });
}

function parseArgs(argv: string[]) {
  let groupId = "";
  let contestId = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--group-id") groupId = argv[i + 1] ?? "";
    if (argv[i] === "--contest-id") contestId = argv[i + 1] ?? "";
  }
  return { groupId, contestId };
}

async function main() {
  const { groupId, contestId } = parseArgs(process.argv.slice(2));
  if (!groupId || !contestId) {
    console.error("Usage: npm run import:worldcup -- --group-id <uuid> --contest-id <uuid>");
    process.exit(1);
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

  const summary = await runWorldCupImport(supabase, groupId, contestId);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
