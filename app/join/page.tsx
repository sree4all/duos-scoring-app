import { redirect } from "next/navigation";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";

/** Kid-friendly league entry: sign in, then auto-join the pilot group. */
export default function PublicJoinPage() {
  if (!isWorldCupPrivateMode()) {
    redirect("/login");
  }
  redirect("/login?next=/welcome");
}
