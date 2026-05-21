"use client";

import { usePathname } from "next/navigation";
import { resolvePageTier } from "@/lib/design/resolve-page-tier";
import { PageShell } from "@/components/layout/page-shell";

export function AppPageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tier = resolvePageTier(pathname);
  return <PageShell tier={tier}>{children}</PageShell>;
}
