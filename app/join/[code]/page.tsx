import { redirect } from "next/navigation";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { normalizeInviteCode } from "@/lib/server/groups/invite-code";

type PageProps = { params: Promise<{ code: string }> };

/** Shareable link with invite code, e.g. /join/DQBGKVTM */
export default async function PublicJoinWithCodePage({ params }: PageProps) {
  const { code } = await params;
  if (!isWorldCupPrivateMode()) {
    redirect("/login");
  }
  const normalized = normalizeInviteCode(code);
  redirect(`/login?next=${encodeURIComponent(`/welcome?code=${normalized}`)}`);
}
