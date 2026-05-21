import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { isWorldCupPrivateMode, getDefaultGroupId } from "@/lib/server/world-cup/flags";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    if (isWorldCupPrivateMode()) {
      const gid = getDefaultGroupId();
      redirect(gid ? `/groups/${gid}` : "/groups");
    }
    redirect(isGroupScopingEnabled() ? "/groups" : "/contests");
  }
  redirect("/login");
}
