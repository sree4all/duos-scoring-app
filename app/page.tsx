import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import {
  isWorldCupPrivateMode,
  getDefaultGroupId,
} from "@/lib/server/world-cup/flags";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    if (isWorldCupPrivateMode()) {
      const gid =
        (isGroupScopingEnabled()
          ? await resolveActiveGroupId(supabase, user.id)
          : null) ?? getDefaultGroupId();
      redirect(gid ? `/groups/${gid}` : "/groups/join");
    }
    redirect(isGroupScopingEnabled() ? "/groups" : "/contests");
  }
  redirect("/login");
}
