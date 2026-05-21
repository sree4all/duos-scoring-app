/**
 * World Cup 2026 theme — aligned with `.cursor/design.json` → `themes.worldCup2026`.
 * Update when design.json changes.
 */

export type PageBackgroundKey = "welcome" | "prediction" | "standings";

export type PageBackgroundDef = {
  assetPath: string;
  imageOpacity: number;
  objectPosition: string;
};

export const WORLD_CUP_THEME_NAME = "World Cup 2026";

/** Authoritative defs (mirror design.json). */
const PAGE_BACKGROUNDS: Record<PageBackgroundKey, PageBackgroundDef> = {
  welcome: {
    assetPath: "/design/world-cup-2026/welcome.png",
    imageOpacity: 0.28,
    objectPosition: "center 40%",
  },
  prediction: {
    assetPath: "/design/world-cup-2026/prediction.png",
    imageOpacity: 0.22,
    objectPosition: "center 55%",
  },
  standings: {
    assetPath: "/design/world-cup-2026/standings.png",
    imageOpacity: 0.25,
    objectPosition: "center center",
  },
};

export function getPageBackgroundDef(key: PageBackgroundKey): PageBackgroundDef {
  return PAGE_BACKGROUNDS[key];
}

export function getPageBackgroundStyle(key: PageBackgroundKey): Record<string, string> {
  const def = getPageBackgroundDef(key);
  return {
    ["--page-hero-image" as string]: `url(${def.assetPath})`,
    ["--page-hero-opacity" as string]: String(def.imageOpacity),
    ["--page-hero-position" as string]: def.objectPosition,
  };
}
