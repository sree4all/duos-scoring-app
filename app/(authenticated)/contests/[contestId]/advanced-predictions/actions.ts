"use server";

import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import type { AdvancedBracketPicks } from "@/lib/domain/world-cup/advanced-bracket";
import { loadKnockoutBracket, listRoundOf32Teams } from "@/lib/server/world-cup/round-of-32-teams";
import { saveUserAdvancedBracketPicks } from "@/lib/server/world-cup/advanced-bracket-service";

export async function saveAdvancedBracketPicks(contestId: string, picks: AdvancedBracketPicks) {
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) {
    return { ok: false as const, error: "Select an active group first." };
  }

  await requireGroupMembership(supabase, activeGroupId, user.id);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const [eligibleTeams, bracket] = await Promise.all([
    listRoundOf32Teams(supabase),
    loadKnockoutBracket(supabase),
  ]);
  if (eligibleTeams.length === 0) {
    return { ok: false as const, error: "Round of 32 teams are not available yet." };
  }

  return saveUserAdvancedBracketPicks(supabase, contestId, user.id, picks, eligibleTeams, bracket);
}
