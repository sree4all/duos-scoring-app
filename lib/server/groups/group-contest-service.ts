import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContestRow } from "@/lib/types/database";

export type CreateGroupContestInput = {
  name: string;
  formatLabel: "prediction" | "rummy_points";
  gameTypeKey?: string;
  legacyTournamentScopeId?: string | null;
};

export class GroupContestService {
  constructor(private readonly supabase: SupabaseClient) {}

  async listContests(groupId: string): Promise<ContestRow[]> {
    const { data, error } = await this.supabase
      .from("contests")
      .select(
        "id, game_type_id, name, state, visibility, group_id, format_label, legacy_tournament_scope_id, default_lock_policy, created_at, updated_at",
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ContestRow[];
  }

  async getContest(contestId: string): Promise<ContestRow | null> {
    const { data, error } = await this.supabase
      .from("contests")
      .select(
        "id, game_type_id, name, state, visibility, group_id, format_label, legacy_tournament_scope_id, default_lock_policy, created_at, updated_at",
      )
      .eq("id", contestId)
      .maybeSingle();

    if (error) throw error;
    return (data as ContestRow | null) ?? null;
  }

  async assertContestInGroup(contestId: string, groupId: string): Promise<ContestRow> {
    const contest = await this.getContest(contestId);
    if (!contest || contest.group_id !== groupId) {
      throw new Error("Contest not found in this group");
    }
    return contest;
  }

  async createDraftContest(
    groupId: string,
    input: CreateGroupContestInput,
  ): Promise<ContestRow> {
    const gameTypeKey =
      input.formatLabel === "rummy_points" ? "points_rummy_standard" : "prediction_league";

    const { data: gameType, error: gtErr } = await this.supabase
      .from("game_types")
      .select("id")
      .eq("key", gameTypeKey)
      .maybeSingle();

    if (gtErr) throw gtErr;
    if (!gameType?.id) {
      throw new Error(`Game type "${gameTypeKey}" is not configured`);
    }

    const { data, error } = await this.supabase
      .from("contests")
      .insert({
        name: input.name,
        game_type_id: gameType.id,
        group_id: groupId,
        format_label: input.formatLabel,
        legacy_tournament_scope_id: input.legacyTournamentScopeId ?? null,
        state: "draft",
        visibility: "private",
      })
      .select(
        "id, game_type_id, name, state, visibility, group_id, format_label, legacy_tournament_scope_id, default_lock_policy, created_at, updated_at",
      )
      .single();

    if (error) throw error;
    return data as ContestRow;
  }

  async publishContest(contestId: string): Promise<void> {
    const { error } = await this.supabase
      .from("contests")
      .update({ state: "published", updated_at: new Date().toISOString() })
      .eq("id", contestId);

    if (error) throw error;
  }
}
