import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContestRow } from "@/lib/types/database";
import type { PageBackgroundKey } from "@/lib/design/world-cup-theme";
import {
  isWorldCupContest,
  resolveWorldCupContestForGroup,
} from "@/lib/server/world-cup/resolve-group-contest";

export type { PageBackgroundKey };

/** Group-level: active World Cup prediction contest → welcome hero (FR-011, group hub). */
export async function resolveWelcomePageBackground(
  supabase: SupabaseClient,
  groupId: string,
): Promise<PageBackgroundKey | null> {
  const contest = await resolveWorldCupContestForGroup(supabase, groupId);
  if (!contest || !isWorldCupContest(contest)) return null;
  return "welcome";
}

export function resolveContestPageBackground(
  contest: Pick<ContestRow, "name" | "format_label">,
  pathname: string,
): PageBackgroundKey | null {
  if (!isWorldCupContest(contest)) return null;
  if (pathname.includes("/leaderboard") || pathname.includes("/standings-new")) {
    return "standings";
  }
  if (pathname.includes("/matches")) return "prediction";
  return null;
}
