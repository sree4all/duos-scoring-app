import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupRepository } from "@/lib/server/groups/repository";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { WorldCupStagesPanel } from "@/components/world-cup/world-cup-stages-panel";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ contestId?: string }>;
};

export default async function WorldCupStagesPage({ params, searchParams }: PageProps) {
  const { groupId } = await params;
  const { contestId } = await searchParams;
  if (!contestId) redirect(`/groups/${groupId}/world-cup/import`);

  const { supabase, user } = await requireUser();
  const group = await new GroupRepository(supabase).getGroupById(groupId);
  if (!group) notFound();
  await requireGroupOwner(supabase, groupId, user.id);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">World Cup rounds</h1>
        <p className="text-sm text-muted-foreground">Reveal rounds and set points</p>
      </header>
      <WorldCupStagesPanel groupId={groupId} contestId={contestId} />
      <Link href={`/contests/${contestId}/matches`} className="text-sm underline">
        View match list
      </Link>
    </section>
  );
}
