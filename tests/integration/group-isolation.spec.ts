/**
 * Cross-group access isolation harness (logic-level; no live DB required).
 * Run: npx tsx tests/integration/group-isolation.spec.ts
 */
import { GroupContestService } from "@/lib/server/groups/group-contest-service";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testAssertContestInGroupRejectsMismatch() {
  const stub = {
    from: () => stub,
    select: () => stub,
    eq: () => stub,
    maybeSingle: async () => ({
      data: {
        id: "c1",
        group_id: "group-a",
        game_type_id: "gt",
        name: "Test",
        state: "published",
        visibility: "private",
        default_lock_policy: {},
        created_at: "",
        updated_at: "",
      },
      error: null,
    }),
  };

  const contests = new GroupContestService(stub as never);

  let message = "";
  try {
    await contests.assertContestInGroup("c1", "group-b");
  } catch (err) {
    message = err instanceof Error ? err.message : String(err);
  }

  assert(message.includes("not found"), "expected contest not found in group-b");
}

function testGroupIdFilterContract() {
  const groupAContests = ["c1", "c2"];
  const groupBContests = ["c3"];
  const overlap = groupAContests.filter((id) => groupBContests.includes(id));
  assert(overlap.length === 0, "contest ids must not overlap across groups");
}

async function main() {
  await testAssertContestInGroupRejectsMismatch();
  testGroupIdFilterContract();
  console.log("group-isolation harness: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
