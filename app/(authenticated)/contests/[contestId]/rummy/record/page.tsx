import { notFound, redirect } from "next/navigation";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { getDefaultGroupId } from "@/lib/server/world-cup/flags";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupOwnerOrScorer } from "@/lib/server/groups/guards";
import { HandEntryForm } from "@/components/rummy/hand-entry-form";

type PageProps = { params: Promise<{ contestId: string }> };

export default async function RummyRecordPage({ params }: PageProps) {
  if (isWorldCupPrivateMode()) {
    const gid = getDefaultGroupId();
    redirect(gid ? `/groups/${gid}` : "/groups");
  }

  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  try {
    await requireGroupOwnerOrScorer(supabase, activeGroupId, user.id);
  } catch {
    notFound();
  }

  const contests = new GroupContestService(supabase);
  const contest = await contests.assertContestInGroup(contestId, activeGroupId);

  const { data: memberRows } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", activeGroupId)
    .is("removed_at", null);

  const participantIds = (memberRows ?? []).map((r) => r.user_id as string);

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Record Rummy hand</h1>
      <p className="text-sm text-muted-foreground">{contest.name}</p>
      <HandEntryForm
        groupId={activeGroupId}
        contestId={contestId}
        participantIds={participantIds}
      />
    </main>
  );
}
