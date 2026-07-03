import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import {
  fetchMatchStandings,
  formatStageLabel,
} from "@/lib/server/world-cup/match-standings";
import { LeaderboardList } from "@/components/world-cup/leaderboard-list";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { resolveContestPageBackground } from "@/lib/design/resolve-page-background";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";
import { Card } from "@/components/ui/card";

/** FIFA World Cup 2026 — Round of 32: Switzerland vs Algeria */
const MATCH_NUMBER = 85;

type MatchStandingsPageProps = {
  params: Promise<{ contestId: string }>;
};

export default async function Match85SwitzerlandAlgeriaStandingsPage({
  params,
}: MatchStandingsPageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contest = await new GroupContestService(supabase).assertContestInGroup(
    contestId,
    activeGroupId,
  );

  const result = await fetchMatchStandings(supabase, contestId, MATCH_NUMBER);
  if (!result) notFound();

  const participantIds = result.entries.map((entry) => entry.participantId);
  const displayNameById = new Map<string, string>();
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", participantIds);
    for (const profile of profiles ?? []) {
      displayNameById.set(
        profile.id as string,
        (profile.display_name as string)?.trim() || "Player",
      );
    }
  }

  const entries = result.entries
    .map((entry) => ({
      participantId: entry.participantId,
      displayName: displayNameById.get(entry.participantId) ?? "Player",
      totalPoints: entry.totalPoints,
    }))
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
    );

  const stageLabel = formatStageLabel(result.stageKey);
  const pageBackground = resolveContestPageBackground(
    contest,
    `/contests/${contestId}/leaderboard`,
  );

  return (
    <section className="relative space-y-4">
      {pageBackground ? <PageHeroLayer pageBackground={pageBackground} /> : null}
      <header className="relative z-[1]">
        <h1 className="text-title-dense">{result.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stageLabel ? `${stageLabel} standings` : "Match standings"} · points from this match
          only
        </p>
        {result.winner ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Winner: <span className="font-medium text-foreground">{result.winner}</span>
          </p>
        ) : null}
      </header>

      <Card variant="glass" className="relative z-[1] p-4">
        <LeaderboardList entries={entries} />
      </Card>

      <div className="relative z-[1] flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
        <Link href={`/contests/${contestId}/leaderboard`} className="underline">
          ← {worldCupCopy.nav.standings}
        </Link>
        <Link href={`/contests/${contestId}/matches`} className="underline">
          {worldCupCopy.nav.worldCupPredictions}
        </Link>
      </div>
    </section>
  );
}
