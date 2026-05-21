import type { SupabaseClient } from "@supabase/supabase-js";
import { GroupRepository } from "@/lib/server/groups/repository";

export class GroupMembershipService {
  private readonly repo: GroupRepository;

  constructor(private readonly supabase: SupabaseClient) {
    this.repo = new GroupRepository(supabase);
  }

  async countOwners(groupId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("group_memberships")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("is_owner", true)
      .is("removed_at", null);

    if (error) throw error;
    return count ?? 0;
  }

  async assertNotLastOwner(groupId: string, targetUserId: string): Promise<void> {
    const membership = await this.repo.getMembership(groupId, targetUserId);
    if (!membership?.isOwner) return;

    const owners = await this.countOwners(groupId);
    if (owners <= 1) {
      throw new Error("Cannot remove or demote the last owner of a group");
    }
  }

  async removeMember(groupId: string, targetUserId: string): Promise<void> {
    await this.assertNotLastOwner(groupId, targetUserId);

    const { error } = await this.supabase
      .from("group_memberships")
      .update({ removed_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .is("removed_at", null);

    if (error) throw error;
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    await this.assertNotLastOwner(groupId, userId);
    await this.removeMember(groupId, userId);
  }

  async setScorer(groupId: string, targetUserId: string, isScorer: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("group_memberships")
      .update({ is_scorer: isScorer })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .is("removed_at", null);

    if (error) throw error;
  }

  async promoteToOwner(groupId: string, targetUserId: string): Promise<void> {
    const { error } = await this.supabase
      .from("group_memberships")
      .update({ is_owner: true })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .is("removed_at", null);

    if (error) throw error;
  }

  async transferOwnership(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    demoteFrom = true,
  ): Promise<void> {
    await this.promoteToOwner(groupId, toUserId);
    if (demoteFrom && fromUserId !== toUserId) {
      await this.assertNotLastOwner(groupId, fromUserId);
      const { error } = await this.supabase
        .from("group_memberships")
        .update({ is_owner: false })
        .eq("group_id", groupId)
        .eq("user_id", fromUserId)
        .is("removed_at", null);

      if (error) throw error;
    }
  }
}
