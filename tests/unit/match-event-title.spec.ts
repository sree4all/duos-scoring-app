/**
 * Run: npx tsx tests/unit/match-event-title.spec.ts
 */
import assert from "node:assert/strict";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";

assert.equal(
  buildLinkedMatchEventTitle(77, "France", "Sweden"),
  "Match 77: France vs Sweden",
);
assert.equal(
  buildLinkedMatchEventTitle(78, "Ivory Coast", "Norway"),
  "Match 78: Ivory Coast vs Norway",
);

console.log("match-event-title: OK");
