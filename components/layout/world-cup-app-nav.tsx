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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#12003B]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-safe-x py-2 sm:max-w-2xl sm:py-3">
        <nav
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {links.map(({ href, label }) => (
            <Link
              key={`${label}-${href}`}
              href={href}
              className={cn(
                "shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:py-2",
                isNavLinkActive(pathname, href)
                  ? "bg-primary/20 text-white"
                  : "text-muted-foreground hover:bg-white/10 hover:text-white",
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
