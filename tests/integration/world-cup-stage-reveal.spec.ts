/**
 * SC-005: reveal gate helper
 * Run: npx tsx tests/integration/world-cup-stage-reveal.spec.ts
 */
import { worldCupCopy } from "@/lib/copy/world-cup";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(worldCupCopy.errors.notOpenYet.length > 10, "kid-friendly not-open message");
  assert(!worldCupCopy.errors.notOpenYet.includes("422"), "no error codes in copy");
  console.log("world-cup-stage-reveal: OK");
}

run();
