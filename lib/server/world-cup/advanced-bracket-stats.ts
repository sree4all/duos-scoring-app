import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberAdvancedBracketRow } from "@/components/world-cup/advanced-bracket-stats-panel";

export async function loadAdvancedBracketStatsForContest(
  supabase: SupabaseClient,
  contestId: string,
  groupId: string,
): Promise<MemberAdvancedBracketRow[]> {
  const { data: memberRows } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId)
    .is("removed_at", null);

  const memberIds = (memberRows ?? []).map((r) => r.user_id as string);
  const displayNameByUserId = new Map<string, string>();

  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", memberIds);
    for (const p of profiles ?? []) {
      displayNameByUserId.set(
        p.id as string,
        (p.display_name as string)?.trim() || "Player",
      );
    }
  }

  const picksByUserId = new Map<
    string,
    { semiFinalistTeams: string[]; finalistTeams: string[]; winnerTeam: string | null }
  >();

  if (memberIds.length > 0) {
    const { data: predictions } = await supabase
      .from("advanced_bracket_predictions")
      .select("user_id, semi_finalist_teams, finalist_teams, winner_team")
      .eq("contest_id", contestId)
      .in("user_id", memberIds);

    for (const row of predictions ?? []) {
      picksByUserId.set(row.user_id as string, {
        semiFinalistTeams: (row.semi_finalist_teams as string[]) ?? [],
        finalistTeams: (row.finalist_teams as string[]) ?? [],
        winnerTeam: (row.winner_team as string | null) ?? null,
      });
    }
  }

  const rows: MemberAdvancedBracketRow[] = memberIds.map((uid) => {
    const picks = picksByUserId.get(uid);
    return {
      displayName: displayNameByUserId.get(uid) ?? `Player ${uid.slice(0, 6)}`,
      semiFinalistTeams: picks?.semiFinalistTeams ?? [],
      finalistTeams: picks?.finalistTeams ?? [],
      winnerTeam: picks?.winnerTeam ?? null,
    };
  });

  rows.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return rows;
}
