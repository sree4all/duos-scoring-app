import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";
import { LeaderboardList } from "@/components/world-cup/leaderboard-list";
import { worldCupCopy } from "@/lib/copy/world-cup";

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

  const { data: ledger } = await supabase
    .from("contest_points_ledger")
    .select("participant_id, action_type, points_delta, reason_text")
    .eq("contest_id", contestId);

  const isRummy = contest.format_label === "rummy_points";
  const sorted = aggregateLeaderboardForContest(
    (ledger ?? []).map((row) => ({
      participantId: row.participant_id as string,
      pointsDelta: Number(row.points_delta ?? 0),
    })),
    { lowerTotalWins: isRummy },
  );

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

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl">{worldCupCopy.nav.standings}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRummy
            ? "Lower total ranks higher."
            : "Higher total ranks higher."}
        </p>
      </header>

      <LeaderboardList entries={entries} />

      <Link
        href={`/contests/${contestId}/matches`}
        className="inline-block text-sm font-medium underline"
      >
        ← {worldCupCopy.nav.worldCupPredictions}
      </Link>
    </section>
  );
}
