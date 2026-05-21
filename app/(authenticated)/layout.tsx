import { AppNav } from "@/components/layout/app-nav";
import { GroupSwitcher } from "@/components/groups/group-switcher";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { GroupRepository } from "@/lib/server/groups/repository";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();

  let groupSwitcher = null;
  if (isGroupScopingEnabled()) {
    const activeGroupId = await resolveActiveGroupId(supabase, user.id);
    const repo = new GroupRepository(supabase);
    const groups = await repo.listActiveGroupsForUser(user.id);
    groupSwitcher = (
      <GroupSwitcher
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        activeGroupId={activeGroupId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        {groupSwitcher}
      </div>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
