import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupRepository } from "@/lib/server/groups/repository";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { isWorldCupImportEnabled } from "@/lib/server/world-cup/flags";
import { WorldCupImportPanel } from "@/components/world-cup/world-cup-import-panel";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ contestId?: string }>;
};

export default async function WorldCupImportPage({ params, searchParams }: PageProps) {
  if (!isWorldCupImportEnabled()) redirect(`/groups/${(await params).groupId}`);

  const { groupId } = await params;
  const { contestId } = await searchParams;
  const { supabase, user } = await requireUser();

  const group = await new GroupRepository(supabase).getGroupById(groupId);
  if (!group) notFound();
  await requireGroupOwner(supabase, groupId, user.id);

  if (!contestId) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Import schedule</h1>
        <p className="text-sm text-muted-foreground">
          Create a World Cup contest first, then open import with{" "}
          <code>?contestId=...</code> in the URL.
        </p>
        <Link href={`/groups/${groupId}/contests/new`} className="font-medium underline">
          Create contest
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Import World Cup schedule</h1>
        <p className="text-sm text-muted-foreground">{group.name}</p>
      </header>
      <WorldCupImportPanel groupId={groupId} contestId={contestId} />
      <Link href={`/groups/${groupId}/world-cup/stages?contestId=${contestId}`} className="text-sm underline">
        Next: open rounds and points
      </Link>
    </section>
  );
}
