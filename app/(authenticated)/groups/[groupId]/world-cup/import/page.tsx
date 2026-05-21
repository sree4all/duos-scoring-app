import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { requireGroupOwnerPageAccess } from "@/lib/server/groups/member-access";
import { isWorldCupImportEnabled } from "@/lib/server/world-cup/flags";
import { WorldCupImportPanel } from "@/components/world-cup/world-cup-import-panel";
import { resolveWorldCupContestForGroup } from "@/lib/server/world-cup/resolve-group-contest";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ contestId?: string }>;
};

export default async function WorldCupImportPage({ params, searchParams }: PageProps) {
  if (!isWorldCupImportEnabled()) redirect(`/groups/${(await params).groupId}`);

  const { groupId } = await params;
  const { contestId } = await searchParams;
  const { supabase, user } = await requireUser();

  const { group } = await requireGroupOwnerPageAccess(supabase, groupId, user.id);

  const resolvedId =
    contestId ?? (await resolveWorldCupContestForGroup(supabase, groupId))?.id;
  if (!resolvedId) {
    redirect(`/groups/${groupId}/world-cup`);
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Import World Cup schedule</h1>
        <p className="text-sm text-muted-foreground">{group.name}</p>
      </header>
      <WorldCupImportPanel groupId={groupId} contestId={resolvedId} />
      <Link href={`/groups/${groupId}/world-cup/stages?contestId=${resolvedId}`} className="text-sm underline">
        Next: open rounds and points
      </Link>
    </section>
  );
}
