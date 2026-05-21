import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { requireGroupOwner } from "@/lib/server/groups/guards";
import { GroupRepository } from "@/lib/server/groups/repository";
import { GroupContestWizard } from "@/components/groups/contest-wizard/group-contest-wizard";

type PageProps = { params: Promise<{ groupId: string }> };

export default async function GroupNewContestPage({ params }: PageProps) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();

  try {
    await requireGroupOwner(supabase, groupId, user.id);
  } catch {
    notFound();
  }

  const group = await new GroupRepository(supabase).getGroupById(groupId);
  if (!group) notFound();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New contest</h1>
      <p className="text-sm text-muted-foreground">Group: {group.name}</p>
      <GroupContestWizard groupId={groupId} />
      <p className="text-sm">
        <Link href={`/groups/${groupId}/settings`} className="underline">
          Back to group settings
        </Link>
      </p>
    </section>
  );
}
