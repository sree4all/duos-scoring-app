"use server";

import { requireUser } from "@/lib/auth/require-user";
import { requireGroupOwnerForContestConfig } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { validatePublishReadiness } from "@/lib/server/generalized-scoring/publish-validation";

export async function saveGroupContestDraft(
  groupId: string,
  input: { name: string; formatLabel: "prediction" | "rummy_points" },
) {
  const { supabase, user } = await requireUser();
  await requireGroupOwnerForContestConfig(supabase, groupId, user.id);

  const service = new GroupContestService(supabase);
  const contest = await service.createDraftContest(groupId, {
    name: input.name,
    formatLabel: input.formatLabel,
  });

  return { ok: true as const, contestId: contest.id };
}

export async function publishGroupContest(
  groupId: string,
  contestId: string,
  readiness: {
    hasEvents: boolean;
    hasScoringPreset: boolean;
    hasValidLockPolicy: boolean;
  },
) {
  const { supabase, user } = await requireUser();
  await requireGroupOwnerForContestConfig(supabase, groupId, user.id);

  const service = new GroupContestService(supabase);
  await service.assertContestInGroup(contestId, groupId);

  const validation = validatePublishReadiness(readiness);
  if (!validation.ok) {
    return { ok: false as const, errors: validation.errors };
  }

  await service.publishContest(contestId);
  return { ok: true as const };
}
