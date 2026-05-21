/**
 * One-time migration: attach unscoped contests to a designated group or archive them.
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-to-groups.ts --group-id <uuid> [--archive]
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function parseArgs() {
  const args = process.argv.slice(2);
  let groupId: string | undefined;
  let archive = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--group-id") groupId = args[++i];
    if (args[i] === "--archive") archive = true;
  }

  return { groupId, archive };
}

async function main() {
  const { groupId, archive } = parseArgs();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  if (!groupId && !archive) {
    console.error("Provide --group-id <uuid> to attach contests, or --archive to mark archived");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: unscoped, error } = await supabase
    .from("contests")
    .select("id, name, state")
    .is("group_id", null);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (!unscoped?.length) {
    console.log("No unscoped contests found.");
    return;
  }

  console.log(`Found ${unscoped.length} unscoped contest(s).`);

  for (const contest of unscoped) {
    if (archive) {
      const { error: upErr } = await supabase
        .from("contests")
        .update({ state: "archived", visibility: "private" })
        .eq("id", contest.id);
      if (upErr) throw upErr;
      console.log(`Archived: ${contest.name} (${contest.id})`);
    } else if (groupId) {
      const { error: upErr } = await supabase
        .from("contests")
        .update({ group_id: groupId, visibility: "private" })
        .eq("id", contest.id);
      if (upErr) throw upErr;
      console.log(`Attached to group ${groupId}: ${contest.name} (${contest.id})`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
