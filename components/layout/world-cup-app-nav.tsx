"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { isNavLinkActive } from "@/lib/navigation/nav-active";

export function WorldCupAppNav({
  homeGroupId,
  defaultContestId,
}: {
  homeGroupId?: string | null;
  defaultContestId?: string | null;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  const homeHref = homeGroupId ? `/groups/${homeGroupId}` : "/join";

  const links: { href: string; label: string }[] = [
    { href: homeHref, label: worldCupCopy.nav.groups },
  ];
  if (defaultContestId) {
    links.push({
      href: `/contests/${defaultContestId}/matches`,
      label: worldCupCopy.nav.worldCupPredictions,
    });
    links.push({
      href: `/contests/${defaultContestId}/leaderboard`,
      label: worldCupCopy.nav.standings,
    });
  }
  links.push({ href: "/history", label: worldCupCopy.nav.myPoints });

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2 sm:max-w-2xl sm:px-4 sm:py-3">
        <nav
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {links.map(({ href, label }) => (
            <Link
              key={`${label}-${href}`}
              href={href}
              className={cn(
                "shrink-0 rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation sm:py-2",
                isNavLinkActive(pathname, href)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 touch-manipulation"
          onClick={signOut}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
