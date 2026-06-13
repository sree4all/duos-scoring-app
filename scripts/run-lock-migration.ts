/**
 * Run the kickoff lock migration against the linked Supabase database.
 *
 * Requires one of these in .env.local:
 * - DATABASE_URL
 * - SUPABASE_DB_URL
 *
 * Or a linked project: npm run db:link
 *
 * Usage: npm run db:run-lock-sql
 */
import { config } from "dotenv";
import { execSync } from "child_process";
import { resolve } from "path";

config({ path: ".env.local" });

const migration = resolve(
  "supabase/migrations/202606130002_match_lock_at_kickoff.sql",
);

const dbUrl =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.SUPABASE_DATABASE_URL;

function runQuery(args: string) {
  execSync(`npx supabase db query ${args}`, {
    stdio: "inherit",
    env: process.env,
  });
}

if (dbUrl) {
  console.log("Running lock migration via DATABASE_URL...");
  runQuery(`-f "${migration}" --db-url "${dbUrl}"`);
  console.log("Lock migration applied.");
  process.exit(0);
}

try {
  console.log("Running lock migration via linked Supabase project...");
  runQuery(`-f "${migration}" --linked`);
  console.log("Lock migration applied.");
} catch {
  console.error(
    [
      "Could not run the migration.",
      "",
      "Add DATABASE_URL to .env.local (Supabase Dashboard → Project Settings → Database → URI),",
      "or link the project with `npm run db:link`, then run `npm run db:run-lock-sql` again.",
      "",
      "Alternatively, paste the SQL from:",
      migration,
      "into Supabase Dashboard → SQL Editor and run it there.",
    ].join("\n"),
  );
  process.exit(1);
}
