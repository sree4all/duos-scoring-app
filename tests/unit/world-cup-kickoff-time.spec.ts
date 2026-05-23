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
import {
  formatKickoffDisplay,
  formatWallClockInOffset,
} from "@/lib/utils/kickoff-display";

/** Match 4 from data/worldcup-2026/matches.csv — SoFi, 9 PM Pacific */
const MATCH_4_KICKOFF = "2026-06-12 21:00:00-07";

const m4 = parseKickoffCell(MATCH_4_KICKOFF);
assert.equal(m4.isoUtc, "2026-06-13T04:00:00.000Z");
assert.equal(m4.tzOffset, "-07:00");

const wall = formatWallClockInOffset(m4.isoUtc, m4.tzOffset!);
assert.match(wall, /Jun 12/);
assert.match(wall, /9:00/);

const display = formatKickoffDisplay(m4.isoUtc, m4.tzOffset);
assert.match(display, /Jun 12/);
assert.match(display, /9:00/);
assert.match(display, /Jun 13/);

assert.equal(parseKickoffAtToIsoUtc("2026-06-11 15:00:00-06"), "2026-06-11T21:00:00.000Z");
assert.equal(
  parseKickoffAtToIsoUtc("2026-06-12T21:00:00-07:00"),
  "2026-06-13T04:00:00.000Z",
);
assert.equal(
  parseKickoffCell("2026-06-12 21:00:00-0700").isoUtc,
  "2026-06-13T04:00:00.000Z",
);

const csvPath = path.join(process.cwd(), "data", "worldcup-2026", "matches.csv");
if (fs.existsSync(csvPath)) {
  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseMatchesCsvContent(raw);
  assert.equal(rows.length, 104);
  for (const row of rows) {
    assert.ok(row.kickoffAt, `match ${row.matchNumber} kickoffAt`);
    assert.ok(row.kickoffTzOffset, `match ${row.matchNumber} tz offset`);
  }
  const row4 = rows.find((r) => r.matchNumber === 4)!;
  assert.equal(row4.kickoffAt, "2026-06-13T04:00:00.000Z");
  assert.equal(row4.kickoffTzOffset, "-07:00");
}

console.log("world-cup-kickoff-time: OK");
console.log(`  Match 4: CSV "${MATCH_4_KICKOFF}"`);
console.log(`    stadium: ${wall}`);
console.log(`    display: ${display}`);
