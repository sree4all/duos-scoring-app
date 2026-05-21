import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { isGroupSeasonBonusesVisible } from "@/lib/server/groups/season-bonuses";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";

type PageProps = { params: Promise<{ contestId: string }> };

export default async function SeasonBonusesPage({ params }: PageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);

  if (!activeGroupId) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Season bonuses</h1>
        <p className="text-sm text-muted-foreground">Select an active group first.</p>
      </main>
    );
  }

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contests = new GroupContestService(supabase);
  await contests.assertContestInGroup(contestId, activeGroupId);

  const { data: cfg } = await supabase
    .from("group_tournament_config")
    .select("season_bonuses_visible_after_utc, season_bonuses_revealed_by_admin")
    .eq("group_id", activeGroupId)
    .eq("season_year", 2026)
    .maybeSingle();

  const visible = isGroupSeasonBonusesVisible(cfg);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Season bonuses</h1>
      {visible ? (
        <p className="text-sm text-muted-foreground">
          Season bonus questions are visible for this group contest.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Season bonuses are hidden until the group owner reveals them or the scheduled time passes.
        </p>
      )}
    </main>
  );
}
