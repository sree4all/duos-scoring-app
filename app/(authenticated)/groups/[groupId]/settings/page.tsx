import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupSettingsPanel } from "@/components/groups/group-settings-panel";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { requireGroupPageAccess } from "@/lib/server/groups/member-access";

type PageProps = { params: Promise<{ groupId: string }> };

export default async function GroupSettingsPage({ params }: PageProps) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();
  const { group, membership } = await requireGroupPageAccess(supabase, groupId, user.id);

  if (isWorldCupPrivateMode() && !membership.isOwner) {
    redirect(`/groups/${groupId}`);
  }

  const { data: memberRows, error: membersError } = await supabase
    .from("group_memberships")
    .select("user_id, is_owner, is_scorer")
    .eq("group_id", groupId)
    .is("removed_at", null);

  if (membersError) throw membersError;

  const members =
    memberRows?.map((row) => ({
      userId: row.user_id as string,
      isOwner: row.is_owner as boolean,
      isScorer: row.is_scorer as boolean,
    })) ?? [];

  return (
    <GroupSettingsPanel
      groupId={group.id}
      groupName={group.name}
      inviteCode={group.currentInviteCode}
      members={members}
      currentUserId={user.id}
      isOwner={membership.isOwner}
      worldCupPrivateMode={isWorldCupPrivateMode()}
    />
  );
}
