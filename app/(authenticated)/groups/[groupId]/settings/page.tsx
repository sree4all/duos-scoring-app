import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupRepository } from "@/lib/server/groups/repository";
import { GroupSettingsPanel } from "@/components/groups/group-settings-panel";
import { setActiveGroupIdCookie } from "@/lib/server/groups/active-context";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ groupId: string }> };

export default async function GroupSettingsPage({ params }: PageProps) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();
  const repo = new GroupRepository(supabase);

  const group = await repo.getGroupById(groupId);
  const membership = await repo.getMembership(groupId, user.id);
  if (!group || !membership) notFound();

  await setActiveGroupIdCookie(groupId);

  const adminClient = await createClient();
  const { data: memberRows } = await adminClient
    .from("group_memberships")
    .select("user_id, is_owner, is_scorer")
    .eq("group_id", groupId)
    .is("removed_at", null);

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
    />
  );
}
