import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { requireGroupOwnerPageAccess } from "@/lib/server/groups/member-access";
import { WorldCupStagesPanel } from "@/components/world-cup/world-cup-stages-panel";
import { resolveWorldCupContestForGroup } from "@/lib/server/world-cup/resolve-group-contest";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ contestId?: string }>;
};

export default async function WorldCupStagesPage({ params, searchParams }: PageProps) {
  const { groupId } = await params;
  const { contestId: contestIdParam } = await searchParams;
  const { supabase, user } = await requireUser();
  const contestId =
    contestIdParam ?? (await resolveWorldCupContestForGroup(supabase, groupId))?.id;
  if (!contestId) redirect(`/groups/${groupId}/world-cup`);

  await requireGroupOwnerPageAccess(supabase, groupId, user.id);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">World Cup rounds</h1>
        <p className="text-sm text-muted-foreground">Reveal rounds and set points</p>
      </header>
      <WorldCupStagesPanel groupId={groupId} contestId={contestId} />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/contests/${contestId}/matches`} className="underline">
          View match list
        </Link>
        <Link href={`/groups/${groupId}/world-cup?contestId=${contestId}`} className="underline">
          Organizer home
        </Link>
      </div>
    </section>
  );
}
