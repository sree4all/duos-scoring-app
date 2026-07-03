import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import {
  fetchStandingsFromMatchNumber,
  STANDINGS_NEW_FROM_MATCH_NUMBER,
} from "@/lib/server/world-cup/match-standings";
import { LeaderboardList } from "@/components/world-cup/leaderboard-list";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { resolveContestPageBackground } from "@/lib/design/resolve-page-background";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";
import { Card } from "@/components/ui/card";

type StandingsNewPageProps = {
  params: Promise<{ contestId: string }>;
};

export default async function StandingsNewPage({ params }: StandingsNewPageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contest = await new GroupContestService(supabase).assertContestInGroup(
    contestId,
    activeGroupId,
  );

  const result = await fetchStandingsFromMatchNumber(
    supabase,
    contestId,
    STANDINGS_NEW_FROM_MATCH_NUMBER,
  );

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

  const pageBackground = resolveContestPageBackground(
    contest,
    `/contests/${contestId}/standings-new`,
  );

  return (
    <section className="relative space-y-4">
      {pageBackground ? <PageHeroLayer pageBackground={pageBackground} /> : null}
      <header className="relative z-[1]">
        <h1 className="text-title-dense">{worldCupCopy.nav.standingsNew}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Points from Match {result.fromMatchNumber} onward. Future matches are added
          automatically once scored.
        </p>
      </header>

      {result.scoredMatches.length > 0 ? (
        <Card variant="glass" className="relative z-[1] p-4">
          <h2 className="text-sm font-semibold">Scored matches included</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {result.scoredMatches.map((match) => (
              <li key={match.matchNumber}>
                {match.title}
                {match.winner ? (
                  <span className="text-foreground"> · {match.winner}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card variant="glass" className="relative z-[1] p-4">
          <p className="text-sm text-muted-foreground">
            No matches from Match {result.fromMatchNumber} have been scored yet.
          </p>
        </Card>
      )}

      <Card variant="glass" className="relative z-[1] p-4">
        <LeaderboardList entries={entries} />
      </Card>

      <div className="relative z-[1] flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
        <Link href={`/contests/${contestId}/leaderboard`} className="underline">
          {worldCupCopy.nav.standings}
        </Link>
        <Link href={`/contests/${contestId}/matches`} className="underline">
          {worldCupCopy.nav.worldCupPredictions}
        </Link>
      </div>
    </section>
  );
}
