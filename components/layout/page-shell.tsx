import { cn } from "@/lib/utils";
import type { SurfaceTier } from "@/lib/design/tokens";

export function PageShell({
  tier,
  children,
  className,
}: {
  tier: SurfaceTier;
  children: React.ReactNode;
  className?: string;
}) {
  const showPatterns = tier === "entry" || tier === "light";

  return (
    <div
      className={cn(
        "page-shell relative min-h-screen text-foreground",
        showPatterns ? "page-shell--patterns" : "page-shell--dense",
        className,
      )}
      data-tier={tier}
    >
      <div className="page-shell__content relative z-[1] flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
