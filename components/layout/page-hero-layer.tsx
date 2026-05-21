import {
  getPageBackgroundDef,
  type PageBackgroundKey,
} from "@/lib/design/world-cup-theme";

/** Low-opacity full-viewport texture over the neon gradient (FR-003). */
export function PageHeroLayer({
  pageBackground,
}: {
  pageBackground: PageBackgroundKey;
}) {
  const def = getPageBackgroundDef(pageBackground);
  return (
    <div
      className="page-shell__hero"
      aria-hidden
      data-page-background={pageBackground}
      style={
        {
          "--page-hero-image": `url(${def.assetPath})`,
          "--page-hero-opacity": def.imageOpacity,
          "--page-hero-position": def.objectPosition,
        } as React.CSSProperties
      }
    />
  );
}
