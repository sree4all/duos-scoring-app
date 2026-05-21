import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group } from "@/lib/domain/groups/types";
import { GroupRepository } from "@/lib/server/groups/repository";
import { GroupMembershipService } from "@/lib/server/groups/membership-service";
import { normalizeInviteCode } from "@/lib/server/groups/invite-code";

export class GroupService {
  private readonly repo: GroupRepository;
  private readonly memberships: GroupMembershipService;

  constructor(private readonly supabase: SupabaseClient) {
    this.repo = new GroupRepository(supabase);
    this.memberships = new GroupMembershipService(supabase);
  }

  async createGroup(name: string, userId: string): Promise<Group> {
    return this.repo.createGroup(name, userId);
  }

  async joinByInviteCode(inviteCode: string, userId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc("join_group_by_invite_code", {
      p_invite_code: normalizeInviteCode(inviteCode),
    });

    if (error) throw error;
    void userId;
    return data as string;
  }

  async regenerateInviteCode(groupId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc("regenerate_group_invite_code", {
      p_group_id: groupId,
    });

    if (error) throw error;
    return data as string;
  }

  getMembershipService(): GroupMembershipService {
    return this.memberships;
  }

  getRepository(): GroupRepository {
    return this.repo;
  }
}
