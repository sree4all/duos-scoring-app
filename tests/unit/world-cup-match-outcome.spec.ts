/**
 * Run: npx tsx tests/unit/world-cup-match-outcome.spec.ts
 */
import {
  MATCH_DRAW_PICK,
  allowsDrawPick,
  validateMatchPick,
  validateOfficialWinner,
} from "@/lib/domain/world-cup/match-outcome";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(allowsDrawPick("group_stage"), "group stage allows draw");
  assert(!allowsDrawPick("round_of_16"), "R16 no draw pick");

  const groupDraw = validateMatchPick("group_stage", "Draw", "Brazil", "Serbia");
  assert(groupDraw.ok && groupDraw.value === MATCH_DRAW_PICK, "group draw pick");

  const groupHome = validateMatchPick("group_stage", "Brazil", "Brazil", "Serbia");
  assert(groupHome.ok && groupHome.value === "Brazil", "group home pick");

  const koDraw = validateMatchPick("final", "Draw", "A", "B");
  assert(!koDraw.ok, "knockout rejects draw pick");

  const koHome = validateMatchPick("final", "A", "A", "B");
  assert(koHome.ok && koHome.value === "A", "knockout home pick");

  const officialDraw = validateOfficialWinner("group_stage", "tie", "A", "B");
  assert(officialDraw.ok && officialDraw.value === MATCH_DRAW_PICK, "official draw");

  const officialKoDraw = validateOfficialWinner("quarter_finals", "Draw", "A", "B");
  assert(!officialKoDraw.ok, "official knockout draw rejected");

  console.log("world-cup-match-outcome: OK");
}

run();
