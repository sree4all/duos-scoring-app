import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupRepository } from "@/lib/server/groups/repository";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveWorldCupContestForGroup } from "@/lib/server/world-cup/resolve-group-contest";
import { seedDefaultStageRules } from "@/lib/server/world-cup/seed-stage-rules";
import { StageRulesRepository } from "@/lib/server/world-cup/stage-rules-repository";
import { WorldCupOrganizerHub } from "@/components/world-cup/world-cup-organizer-hub";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ contestId?: string }>;
};

export default async function WorldCupOrganizerPage({ params, searchParams }: PageProps) {
  const { groupId } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const group = await new GroupRepository(supabase).getGroupById(groupId);
  if (!group) notFound();
  await requireGroupOwner(supabase, groupId, user.id);

  const contestFromQuery = sp.contestId
    ? await new GroupContestService(supabase).getContest(sp.contestId)
    : null;
  const contestResolved =
    contestFromQuery ?? (await resolveWorldCupContestForGroup(supabase, groupId));

  if (contestResolved && contestResolved.group_id !== groupId) notFound();

  if (!contestResolved) {
    const created = await new GroupContestService(supabase).createDraftContest(groupId, {
      name: "World Cup 2026",
      formatLabel: "prediction",
    });
    await seedDefaultStageRules(supabase, created.id, groupId);
    redirect(`/groups/${groupId}/world-cup?contestId=${created.id}`);
  }

  const contest = contestResolved;

  const { count: eventCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contest.id)
    .not("source_match_id", "is", null);

  const rules = await new StageRulesRepository(supabase).listForContest(contest.id, false);
  const groupStageRevealed = rules.some(
    (r) => r.stageKey === "group_stage" && r.revealedAt,
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">World Cup organizer</h1>
        <p className="text-sm text-muted-foreground">{group.name}</p>
      </header>
      <WorldCupOrganizerHub
        groupId={groupId}
        contestId={contest.id}
        contestName={contest.name}
        contestState={contest.state}
        linkedEvents={eventCount ?? 0}
        groupStageRevealed={groupStageRevealed}
      />
      <p className="text-xs text-muted-foreground">
        Need another contest?{" "}
        <Link href={`/groups/${groupId}/contests/new`} className="underline">
          Advanced setup wizard
        </Link>
      </p>
    </section>
  );
}
