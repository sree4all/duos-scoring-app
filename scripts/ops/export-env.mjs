/**
 * Print shell exports for vars in .env / .env.local.
 * Skips keys already set in the environment (Cursor Secrets take precedence).
 */
import { parse } from "dotenv";
import fs from "fs";
import { resolve } from "path";

const RELEVANT =
  /^(NEXT_PUBLIC_|SUPABASE_|VERCEL_|GROUP_|WORLD_CUP_|DEFAULT_|DATABASE_URL$)/;

function readEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return {};
  return parse(fs.readFileSync(filePath));
}

const fromFiles = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };

for (const [key, val] of Object.entries(fromFiles)) {
  if (!RELEVANT.test(key)) continue;
  if (process.env[key] !== undefined) continue;
  const escaped = String(val).replace(/'/g, "'\\''");
  process.stdout.write(`export ${key}='${escaped}'\n`);
}
