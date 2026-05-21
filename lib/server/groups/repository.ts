import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupMembership } from "@/lib/domain/groups/types";
import { generateInviteCode } from "@/lib/server/groups/invite-code";

type GroupRow = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  current_invite_code: string;
  invite_code_rotated_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  id: string;
  group_id: string;
  user_id: string;
  is_owner: boolean;
  is_scorer: boolean;
  joined_at: string;
  removed_at: string | null;
};

function mapGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status as Group["status"],
    currentInviteCode: row.current_invite_code,
    inviteCodeRotatedAt: row.invite_code_rotated_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMembership(row: MembershipRow): GroupMembership {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    isOwner: row.is_owner,
    isScorer: row.is_scorer,
    joinedAt: row.joined_at,
    removedAt: row.removed_at,
  };
}

export class GroupRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createGroup(name: string, createdBy: string): Promise<Group> {
    const inviteCode = generateInviteCode();
    const { data, error } = await this.supabase
      .from("groups")
      .insert({
        name: name.trim(),
        current_invite_code: inviteCode,
        created_by: createdBy,
      })
      .select("*")
      .single();

    if (error || !data) throw error ?? new Error("Failed to create group");

    const { error: memberError } = await this.supabase.from("group_memberships").insert({
      group_id: data.id,
      user_id: createdBy,
      is_owner: true,
      is_scorer: false,
    });

    if (memberError) throw memberError;

    return mapGroup(data as GroupRow);
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    const { data, error } = await this.supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapGroup(data as GroupRow) : null;
  }

  async getMembership(groupId: string, userId: string): Promise<GroupMembership | null> {
    const { data, error } = await this.supabase
      .from("group_memberships")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .is("removed_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? mapMembership(data as MembershipRow) : null;
  }

  async listMembershipsForUser(userId: string): Promise<GroupMembership[]> {
    const { data, error } = await this.supabase
      .from("group_memberships")
      .select("*")
      .eq("user_id", userId)
      .is("removed_at", null);

    if (error) throw error;
    return (data ?? []).map((row) => mapMembership(row as MembershipRow));
  }

  async listActiveGroupsForUser(userId: string): Promise<Group[]> {
    const memberships = await this.listMembershipsForUser(userId);
    if (memberships.length === 0) return [];

    const ids = memberships.map((m) => m.groupId);
    const { data, error } = await this.supabase.from("groups").select("*").in("id", ids);

    if (error) throw error;
    return (data ?? []).map((row) => mapGroup(row as GroupRow));
  }
}
