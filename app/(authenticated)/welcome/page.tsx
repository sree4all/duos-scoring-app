import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { ensurePilotGroupMembership } from "@/lib/server/groups/auto-join";
import {
  getDefaultContestId,
  isWorldCupPrivateMode,
} from "@/lib/server/world-cup/flags";

type PageProps = { searchParams: Promise<{ code?: string; next?: string }> };

function safeInternalPath(path: string | undefined): string | null {
  if (!path?.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

export default async function WelcomePage({ searchParams }: PageProps) {
  if (!isWorldCupPrivateMode()) {
    redirect("/groups");
  }

  const { code, next } = await searchParams;
  const { supabase, user } = await requireUser();

  const result = await ensurePilotGroupMembership(supabase, user.id, code ?? null);
  if (!result.ok) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Join your league</h1>
        <p className="text-sm text-destructive">{result.error}</p>
        <Link href="/groups/join" className="text-sm font-medium underline">
          Enter invite code manually
        </Link>
      </section>
    );
  }

  const destination = safeInternalPath(next);
  if (destination) {
    redirect(destination);
  }

  const contestId = getDefaultContestId();
  if (contestId) {
    redirect(`/contests/${contestId}/matches`);
  }

  redirect(`/groups/${result.groupId}`);
}
