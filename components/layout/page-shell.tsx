import { cn } from "@/lib/utils";
import type { SurfaceTier } from "@/lib/design/tokens";
import type { PageBackgroundKey } from "@/lib/design/world-cup-theme";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";

export function PageShell({
  tier,
  pageBackground = null,
  children,
  className,
}: {
  tier: SurfaceTier;
  pageBackground?: PageBackgroundKey | null;
  children: React.ReactNode;
  className?: string;
}) {
  const showPatterns = tier === "entry" || tier === "light";

  return (
    <div
      className={cn(
        "page-shell relative min-h-screen text-foreground",
        showPatterns ? "page-shell--patterns" : "page-shell--dense",
        pageBackground ? "page-shell--has-hero" : null,
        className,
      )}
      data-tier={tier}
    >
      {pageBackground ? <PageHeroLayer pageBackground={pageBackground} /> : null}
      <div className="page-shell__content relative z-[1] flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
