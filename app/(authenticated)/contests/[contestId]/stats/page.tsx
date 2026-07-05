import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { shouldHidePeerPredictions } from "@/lib/server/world-cup/prediction-visibility";

type PageProps = { params: Promise<{ contestId: string }> };

export default async function ContestStatsPage({ params }: PageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);

  if (!activeGroupId) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Prediction stats</h1>
        <p className="text-sm text-muted-foreground">Select an active group first.</p>
      </main>
    );
  }

  const membership = await requireGroupMembership(supabase, activeGroupId, user.id);
  const contests = new GroupContestService(supabase);
  await contests.assertContestInGroup(contestId, activeGroupId);

  const isOwner = membership.isOwner;

  const { data: events } = await supabase
    .from("events")
    .select("id, title, state, source_match_id, lock_at")
    .eq("contest_id", contestId);

  const lockedEvents = (events ?? []).filter(
    (e) => e.state === "locked" || e.state === "scored" || e.state === "finalized",
  );

  const distributions: { eventTitle: string; winnerCounts: Record<string, number> }[] = [];

  for (const event of lockedEvents) {
    const matchId = event.source_match_id as string | null;
    if (!matchId) continue;

    const { data: match } = await supabase
      .from("matches")
      .select("match_time_utc")
      .eq("id", matchId)
      .maybeSingle();

    const kickoffUtc = (match?.match_time_utc as string | null) ?? "";
    if (
      kickoffUtc &&
      shouldHidePeerPredictions(isOwner, kickoffUtc)
    ) {
      continue;
    }

    const { data: predictions } = await supabase
      .from("predictions")
      .select("predicted_winner")
      .eq("match_id", matchId);

    const winnerCounts: Record<string, number> = {};
    for (const p of predictions ?? []) {
      const key = (p.predicted_winner as string) ?? "unknown";
      winnerCounts[key] = (winnerCounts[key] ?? 0) + 1;
    }

    distributions.push({
      eventTitle: event.title as string,
      winnerCounts,
    });
  }

  const hasHiddenPreKickoff = lockedEvents.length > 0 && distributions.length === 0;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Prediction stats</h1>
      <p className="text-sm text-muted-foreground">
        Aggregate pick distributions after kickoff. Pre-kickoff picks stay private for members.
      </p>
      {hasHiddenPreKickoff && !isOwner ? (
        <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {worldCupCopy.prediction.hiddenUntilKickoff}
        </p>
      ) : null}
      {distributions.map((d) => (
        <section key={d.eventTitle} className="rounded-lg border p-4">
          <h2 className="font-medium">{d.eventTitle}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(d.winnerCounts).map(([pick, count]) => (
              <li key={pick}>
                {pick}: {count}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {distributions.length === 0 && !hasHiddenPreKickoff ? (
        <p className="text-sm text-muted-foreground">
          No locked events with visible predictions yet.
        </p>
      ) : null}
    </main>
  );
}
