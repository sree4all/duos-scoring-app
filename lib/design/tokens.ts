/**
 * Design tokens aligned with `.cursor/design.json`.
 * Update this file when design.json changes.
 */

export type SurfaceTier = "entry" | "light" | "dense";

export const colors = {
  background: {
    base: "#12003B",
    deepPurple: "#18004F",
    royalPurple: "#2B0A88",
    electricBlue: "#11398C",
    violetGlow: "#5917FF",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255, 255, 255, 0.92)",
    /** Tuned above raw 0.35 for WCAG 2.1 AA on dark purple */
    muted: "rgba(255, 255, 255, 0.62)",
  },
  cta: {
    primary: "#10B69B",
    hover: "#13C5A7",
    pressed: "#0D9D87",
    text: "#FFFFFF",
  },
  accent: {
    orangeStar: "#FF7044",
    yellowHighlight: "#E4FF3B",
    scoreGreen: "#4FB84C",
    scoreBlue: "#394BFF",
    scoreRed: "#FF254D",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.08)",
  },
} as const;

export const spacing = {
  baseUnit: 4,
  scale: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 40,
    "3xl": 48,
    "4xl": 56,
  },
  verticalRhythm: 40,
  contentWidth: 340,
  safePadding: {
    top: 32,
    left: 28,
    right: 28,
    bottom: 40,
  },
} as const;

export const typography = {
  hero: {
    fontSize: "54px",
    fontWeight: 800,
    lineHeight: 0.98,
    letterSpacing: "-1.6px",
  },
  bodyLg: {
    fontSize: "27px",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "-0.2px",
  },
  buttonLabel: {
    fontSize: "31px",
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: "-0.6px",
  },
  titleDense: {
    fontSize: "34px",
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-0.8px",
  },
  bodyDense: {
    fontSize: "17px",
    fontWeight: 400,
    lineHeight: 1.45,
    letterSpacing: "-0.1px",
  },
  caption: {
    fontSize: "18px",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "-0.2px",
  },
} as const;

export const radii = {
  cta: "20px",
  card: "12px",
} as const;

export const components = {
  primaryButton: {
    height: 92,
    borderRadius: 20,
  },
  compactButton: {
    minHeight: 44,
  },
} as const;
