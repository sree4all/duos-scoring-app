import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContestRow } from "@/lib/types/database";

export interface RepositoryContext {
  requestId?: string;
  groupId?: string;
  supabase?: SupabaseClient;
}

export class GeneralizedScoringRepositories {
  constructor(private readonly context: RepositoryContext = {}) {}

  getContext() {
    return this.context;
  }

  requireGroupId(): string {
    const groupId = this.context.groupId;
    if (!groupId) {
      throw new Error("Group context is required for this operation");
    }
    return groupId;
  }

  private client(): SupabaseClient {
    if (!this.context.supabase) {
      throw new Error("Supabase client is required for repository queries");
    }
    return this.context.supabase;
  }

  async getContestById(contestId: string): Promise<ContestRow | null> {
    const groupId = this.context.groupId;
    let query = this.client()
      .from("contests")
      .select(
        "id, game_type_id, name, state, visibility, group_id, format_label, tournament_scope_id, default_lock_policy, created_at, updated_at",
      )
      .eq("id", contestId);

    if (groupId) query = query.eq("group_id", groupId);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return (data as ContestRow | null) ?? null;
  }

  async getEventById(eventId: string) {
    const groupId = this.context.groupId;
    const { data: event, error } = await this.client()
      .from("events")
      .select("id, contest_id, title, state, voided")
      .eq("id", eventId)
      .maybeSingle();

    if (error) throw error;
    if (!event) return null;

    if (groupId) {
      const contest = await this.getContestById(event.contest_id as string);
      if (!contest || contest.group_id !== groupId) return null;
    }

    return event;
  }

  async listContestsForGroup(groupId: string) {
    const { data, error } = await this.client()
      .from("contests")
      .select("id, name, state, format_label")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return {
      groupId,
      contests: (data ?? []).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        state: c.state as string,
        formatLabel: (c.format_label as string | null) ?? "prediction",
      })),
    };
  }
}

export function createGeneralizedScoringRepositories(context?: RepositoryContext) {
  return new GeneralizedScoringRepositories(context);
}
