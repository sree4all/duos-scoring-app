import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";
import { ensurePilotGroupMembership } from "@/lib/server/groups/auto-join";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import {
  getDefaultContestId,
  getDefaultGroupId,
  isWorldCupPrivateMode,
} from "@/lib/server/world-cup/flags";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function safeInternalPath(path: string | undefined): string | null {
  if (!path?.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const privatePilot = isWorldCupPrivateMode();
  const redirectAfterAuth =
    safeInternalPath(params.next) ?? (privatePilot ? "/welcome" : "/contests");

  if (user) {
    if (privatePilot) {
      if (redirectAfterAuth.startsWith("/welcome")) {
        redirect(redirectAfterAuth);
      }
      const join = await ensurePilotGroupMembership(supabase, user.id);
      if (join.ok) {
        const contestId = getDefaultContestId();
        redirect(
          contestId ? `/contests/${contestId}/matches` : `/groups/${join.groupId}`,
        );
      }
      const gid =
        (isGroupScopingEnabled()
          ? await resolveActiveGroupId(supabase, user.id)
          : null) ?? getDefaultGroupId();
      redirect(gid ? `/groups/${gid}` : "/welcome");
    }
    redirect(redirectAfterAuth);
  }

  return (
    <PageShell tier="entry">
      <div className="section-gap flex min-h-screen flex-col items-center justify-center px-safe-x py-12">
        <Card variant="glass" className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-hero text-left sm:text-center">
              The Duos Fam World Cup Prediction Game 2026
            </CardTitle>
            <p className="text-body-lg text-left !text-base sm:text-center">
              {privatePilot
                ? "Sign in to join your family league and make match predictions."
                : "Sign in to participate in contests and view leaderboard updates."}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {params.error === "auth" ? (
              <p className="rounded-xl bg-destructive/15 px-3 py-2 text-center text-sm text-destructive">
                Sign-in failed. Try again.
              </p>
            ) : null}
            <LoginForm redirectPath={redirectAfterAuth} />
            {privatePilot ? (
              <p className="text-center text-caption">
                Share this link with players:{" "}
                <Link
                  href="/join"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Join the league
                </Link>
              </p>
            ) : (
              <p className="text-center text-caption">
                <Link href="/" className="text-primary underline-offset-4 hover:underline">
                  Home
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
