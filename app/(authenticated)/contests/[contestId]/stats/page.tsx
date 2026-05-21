import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";

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

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contests = new GroupContestService(supabase);
  await contests.assertContestInGroup(contestId, activeGroupId);

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

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Prediction stats</h1>
      <p className="text-sm text-muted-foreground">
        Aggregate pick distributions after lock. Pre-lock drafts are not shown.
      </p>
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
      {distributions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No locked events with predictions yet.</p>
      ) : null}
    </main>
  );
}
