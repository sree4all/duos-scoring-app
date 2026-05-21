import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(isGroupScopingEnabled() ? "/groups" : "/contests");
  }
  redirect("/login");
}
