import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { fetchContestLeaderboard } from "@/lib/server/world-cup/contest-leaderboard";
import { LeaderboardList } from "@/components/world-cup/leaderboard-list";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { resolveContestPageBackground } from "@/lib/design/resolve-page-background";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";
import { Card } from "@/components/ui/card";

type LeaderboardPageProps = {
  params: Promise<{ contestId: string }>;
};

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contests = new GroupContestService(supabase);
  const contest = await contests.assertContestInGroup(contestId, activeGroupId);

  const isRummy = contest.format_label === "rummy_points";
  const sorted = await fetchContestLeaderboard(supabase, contestId, contest.format_label, {
    lowerTotalWins: isRummy,
  });

  const participantIds = sorted.map((e) => e.participantId);
  const displayNameById = new Map<string, string>();
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", participantIds);
    for (const p of profiles ?? []) {
      displayNameById.set(
        p.id as string,
        (p.display_name as string)?.trim() || "Player",
      );
    }
  }

  const entries = sorted.map((entry) => ({
    participantId: entry.participantId,
    displayName: displayNameById.get(entry.participantId) ?? "Player",
    totalPoints: entry.totalPoints,
  }));

  entries.sort((a, b) => {
    const pointsDiff = isRummy
      ? a.totalPoints - b.totalPoints
      : b.totalPoints - a.totalPoints;
    if (pointsDiff !== 0) return pointsDiff;
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
  });

  const pageBackground = resolveContestPageBackground(
    contest,
    `/contests/${contestId}/leaderboard`,
  );

  return (
    <section className="relative space-y-4">
      {pageBackground ? <PageHeroLayer pageBackground={pageBackground} /> : null}
      <header className="relative z-[1]">
        <h1 className="text-title-dense">{worldCupCopy.nav.standings}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRummy
            ? "Lower total ranks higher."
            : "Higher total ranks higher."}
        </p>
      </header>

      <Card variant="glass" className="relative z-[1] p-4">
        <LeaderboardList entries={entries} />
      </Card>

      <Link
        href={`/contests/${contestId}/matches`}
        className="relative z-[1] inline-block text-sm font-medium underline"
      >
        ← {worldCupCopy.nav.worldCupPredictions}
      </Link>
    </section>
  );
}
