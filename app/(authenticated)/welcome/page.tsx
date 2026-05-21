import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { ensurePilotGroupMembership } from "@/lib/server/groups/auto-join";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { resolveWorldCupContestForGroup } from "@/lib/server/world-cup/resolve-group-contest";
import { resolveWelcomePageBackground } from "@/lib/design/resolve-page-background";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
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
        <h1 className="text-title-dense">Join your league</h1>
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

  const groupId = result.groupId;
  const activeGroupId =
    (await resolveActiveGroupId(supabase, user.id)) ?? groupId;
  const wcContest = await resolveWorldCupContestForGroup(supabase, activeGroupId);
  const welcomeBackground = await resolveWelcomePageBackground(
    supabase,
    activeGroupId,
  );

  const contestId = wcContest?.id ?? getDefaultContestId();
  if (!welcomeBackground && contestId) {
    redirect(`/contests/${contestId}/matches`);
  }

  if (!welcomeBackground) {
    redirect(`/groups/${groupId}`);
  }

  const matchesHref = `/contests/${wcContest!.id}/matches`;

  return (
    <>
      <PageHeroLayer pageBackground="welcome" />
      <section className="relative z-[1] flex min-h-[70vh] flex-col items-center justify-center gap-8 py-8 text-center">
        <div className="space-y-4">
          <h1 className="text-hero">World Cup 2026</h1>
          <p className="text-body-lg text-white/90">
            Pick winners, climb the standings, and play with your group.
          </p>
        </div>
        <Button size="cta" asChild>
          <Link href={matchesHref}>{worldCupCopy.nav.worldCupPredictions}</Link>
        </Button>
        <p className="text-caption text-muted-foreground">
          <Link href={`/groups/${groupId}`} className="underline">
            {worldCupCopy.nav.groups}
          </Link>
        </p>
      </section>
    </>
  );
}
