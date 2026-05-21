import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { GroupRepository } from "@/lib/server/groups/repository";

export default async function GroupsHomePage() {
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);

  if (activeGroupId) {
    redirect(`/groups/${activeGroupId}`);
  }

  const repo = new GroupRepository(supabase);
  const groups = await repo.listActiveGroupsForUser(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your groups</h1>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a group or join with an invite code to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="text-primary underline">
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        <Link href="/groups/new" className="text-sm font-medium underline">
          Create group
        </Link>
        <Link href="/groups/join" className="text-sm font-medium underline">
          Join with code
        </Link>
      </div>
    </div>
  );
}
