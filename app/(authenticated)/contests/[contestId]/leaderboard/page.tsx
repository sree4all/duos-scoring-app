import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { aggregateLeaderboardForContest } from "@/lib/server/generalized-scoring/scoring-projection-service";
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

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <p className="text-sm text-muted-foreground">
        {isRummy
          ? "Points rummy: lower cumulative total ranks higher."
          : "Prediction: higher total ranks higher. Bonus lines included in totals."}
      </p>
      <ul className="space-y-2">
        {sorted.map((entry, index) => (
          <li
            key={entry.participantId}
            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
          >
            <span className="font-medium">#{index + 1}</span>
            <span className="font-mono">{entry.participantId.slice(0, 8)}…</span>
            <span>{entry.totalPoints} pts</span>
          </li>
        ))}
        {sorted.length === 0 ? (
          <li className="text-muted-foreground">No scores yet for this contest.</li>
        ) : null}
      </ul>
    </main>
  );
}
