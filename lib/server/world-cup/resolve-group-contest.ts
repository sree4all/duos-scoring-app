import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContestRow } from "@/lib/types/database";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { getDefaultContestId } from "@/lib/server/world-cup/flags";

export function isWorldCupContestName(name: string | null | undefined): boolean {
  const n = (name ?? "").toLowerCase();
  return n.includes("world cup") || n.includes("fifa") || n.includes("wc 2026");
}

export function isWorldCupContest(contest: Pick<ContestRow, "name" | "format_label">): boolean {
  return (
    contest.format_label === "prediction" && isWorldCupContestName(contest.name)
  );
}

/** Primary World Cup contest for a group (published preferred, else newest). */
export async function resolveWorldCupContestForGroup(
  supabase: SupabaseClient,
  groupId: string,
): Promise<ContestRow | null> {
  const defaultId = getDefaultContestId();
  const service = new GroupContestService(supabase);

  if (defaultId) {
    try {
      const contest = await service.assertContestInGroup(defaultId, groupId);
      if (isWorldCupContest(contest) || contest.format_label === "prediction") {
        return contest;
      }
    } catch {
      /* fall through */
    }
  }

  const contests = await service.listContests(groupId);
  const worldCup = contests.filter(isWorldCupContest);
  if (worldCup.length === 0) {
    const prediction = contests.filter((c) => c.format_label === "prediction");
    if (prediction.length === 1) return prediction[0]!;
    return null;
  }

  const published = worldCup.find((c) => c.state === "published");
  return published ?? worldCup[0]!;
}
