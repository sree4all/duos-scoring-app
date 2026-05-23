/**
 * Run: npx tsx tests/unit/world-cup-kickoff-time.spec.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  parseKickoffAtToIsoUtc,
  parseKickoffCell,
} from "@/lib/server/world-cup/kickoff-time";
import { parseMatchesCsvContent } from "@/lib/server/world-cup/csv-parsers";
import { formatKickoffDisplay } from "@/lib/utils/kickoff-display";
import { easternWallClockToIsoUtc } from "@/lib/utils/eastern-time";

/** Match 4 — wall clock 9 PM Eastern; host suffix -07 ignored */
const MATCH_4_KICKOFF = "2026-06-12 21:00:00-07";

const m4 = parseKickoffCell(MATCH_4_KICKOFF);
assert.equal(m4.isoUtc, "2026-06-13T01:00:00.000Z");
assert.equal(m4.tzOffset, null);

const display = formatKickoffDisplay(m4.isoUtc);
assert.match(display, /Jun 12/);
assert.match(display, /9:00/);
assert.match(display, /Eastern/);

assert.equal(parseKickoffAtToIsoUtc("2026-06-11 15:00:00-06"), "2026-06-11T19:00:00.000Z");
assert.equal(parseKickoffAtToIsoUtc("2026-06-12T21:00:00-07:00"), "2026-06-13T01:00:00.000Z");
assert.equal(parseKickoffCell("2026-06-12 21:00:00-0700").isoUtc, "2026-06-13T01:00:00.000Z");

assert.equal(
  easternWallClockToIsoUtc("2026-06-12", "21:00:00"),
  "2026-06-13T01:00:00.000Z",
);

const csvPath = path.join(process.cwd(), "data", "worldcup-2026", "matches.csv");
if (fs.existsSync(csvPath)) {
  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseMatchesCsvContent(raw);
  assert.equal(rows.length, 104);
  for (const row of rows) {
    assert.ok(row.kickoffAt, `match ${row.matchNumber} kickoffAt`);
    assert.equal(row.kickoffTzOffset, null);
  }
  const row4 = rows.find((r) => r.matchNumber === 4)!;
  assert.equal(row4.kickoffAt, "2026-06-13T01:00:00.000Z");
}

console.log("world-cup-kickoff-time: OK");
console.log(`  Match 4 CSV "${MATCH_4_KICKOFF}" → ${display}`);
