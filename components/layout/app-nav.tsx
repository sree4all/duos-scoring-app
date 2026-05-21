"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { WorldCupAppNav } from "@/components/layout/world-cup-app-nav";

const links = [
  { href: "/groups", label: "Groups" },
  { href: "/contests", label: "Contests" },
  { href: "/history", label: "History" },
  { href: "/admin/scoring", label: "Scoring" },
  { href: "/admin", label: "Admin" },
];

function DefaultAppNav() {
  const pathname = usePathname();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#12003B]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-safe-x py-3">
        <nav className="flex gap-1 sm:gap-2" aria-label="Main">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname === href
                  ? "bg-primary/20 text-white"
                  : "text-muted-foreground hover:bg-white/10 hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Button type="button" variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}

export function AppNav({
  worldCupPrivateMode = false,
  homeGroupId = null,
  defaultContestId = null,
}: {
  worldCupPrivateMode?: boolean;
  homeGroupId?: string | null;
  defaultContestId?: string | null;
}) {
  if (worldCupPrivateMode) {
    return (
      <WorldCupAppNav
        homeGroupId={homeGroupId}
        defaultContestId={defaultContestId}
      />
    );
  }
  return <DefaultAppNav />;
}
