# Contracts — App-Wide Design System Styling

UI presentation contracts for the Next.js app. No HTTP API or database schema changes.

| Contract | Purpose |
|----------|---------|
| [design-tokens.md](./design-tokens.md) | Mapping `.cursor/design.json` → CSS variables and Tailwind theme |
| [page-shell.md](./page-shell.md) | Page background tiers, padding, pattern overlays |
| [component-variants.md](./component-variants.md) | Button, card, nav, and score emphasis variants |
| [visual-qa-checklist.md](./visual-qa-checklist.md) | Manual screen review for SC-001 / FR-012 |

Implementation files: `lib/design/tokens.ts`, `lib/design/resolve-page-tier.ts`, `app/globals.css`, `tailwind.config.ts`, `components/layout/page-shell.tsx`, `components/layout/app-page-shell.tsx`.
