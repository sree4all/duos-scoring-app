import type { SurfaceTier } from "@/lib/design/tokens";

/** Longest-prefix wins; default dense for unlisted authenticated routes. */
const TIER_RULES: { prefix: string; tier: SurfaceTier; exact?: boolean }[] = [
  { prefix: "/login", tier: "entry", exact: true },
  { prefix: "/join", tier: "entry" },
  { prefix: "/welcome", tier: "light", exact: true },
  { prefix: "/groups/new", tier: "light" },
  { prefix: "/groups/join", tier: "light" },
  { prefix: "/groups", tier: "light", exact: true },
  { prefix: "/contests", tier: "light", exact: true },
  { prefix: "/history", tier: "dense" },
  { prefix: "/admin", tier: "dense" },
  { prefix: "/contests/", tier: "dense" },
  { prefix: "/groups/", tier: "dense" },
];

function matchesRule(pathname: string, rule: (typeof TIER_RULES)[number]): boolean {
  if (rule.exact) return pathname === rule.prefix;
  return pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`);
}

/**
 * Group hub: `/groups/[id]` only (no further segments) → light.
 */
function isGroupHub(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2 && parts[0] === "groups";
}

export function resolvePageTier(pathname: string): SurfaceTier {
  if (isGroupHub(pathname)) return "light";

  let best: { tier: SurfaceTier; len: number } | null = null;
  for (const rule of TIER_RULES) {
    if (!matchesRule(pathname, rule)) continue;
    const len = rule.prefix.length;
    if (!best || len > best.len) best = { tier: rule.tier, len };
  }
  return best?.tier ?? "dense";
}
