import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import {
  isWorldCupPrivateMode,
  getDefaultGroupId,
  getDefaultContestId,
} from "@/lib/server/world-cup/flags";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (isWorldCupPrivateMode()) {
      const contestId = getDefaultContestId();
      const gid =
        (isGroupScopingEnabled()
          ? await resolveActiveGroupId(supabase, user.id)
          : null) ?? getDefaultGroupId();
      if (gid && contestId) {
        redirect(`/contests/${contestId}/matches`);
      }
      redirect(gid ? `/groups/${gid}` : "/welcome");
    }
    redirect(isGroupScopingEnabled() ? "/groups" : "/contests");
  }

  if (isWorldCupPrivateMode()) {
    redirect("/join");
  }
  redirect("/login");
}
