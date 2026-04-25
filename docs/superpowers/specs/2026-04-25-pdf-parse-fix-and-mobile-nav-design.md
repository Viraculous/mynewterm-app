# Design: pdf-parse TypeScript Fix + Mobile-Friendly Navigation

**Date:** 2026-04-25
**Status:** Approved
**Scope:** Two related fixes to unblock the production build and make the app usable on mobile.

## Goals

1. Eliminate the TypeScript build error in `app/api/parse-document/route.ts` so `npm run build` succeeds.
2. Replace the fixed 220px left sidebar with a hamburger-driven drawer on mobile screens, while preserving the existing desktop sidebar exactly as-is.
3. Verify all pages stack acceptably on small screens; fix any that don't.

## Non-Goals

- Redesigning the navigation visually (colors, icons, items stay the same).
- Refactoring unrelated layout code.
- Adding swipe gestures, animations beyond a simple slide, or accessibility features beyond `aria-label` / focus-trap basics.

## Issue 1 — pdf-parse Import

### Current state

```ts
// app/api/parse-document/route.ts:27
const pdfParse = (await import("pdf-parse")).default;
```

`pdf-parse` ships as CommonJS (`module.exports = fn`). Its type declarations don't expose a `default` property, so TS errors with `Property 'default' does not exist on type typeof import pdf-parse`.

### Fix

Replace the dynamic `import()` with `require()` and a typed function alias:

```ts
const pdfParse = require("pdf-parse") as (
  buffer: Buffer
) => Promise<{ text: string }>;
const data = await pdfParse(buffer);
```

Rationale:
- `require()` returns the CJS export directly — no `.default` to resolve.
- The cast preserves type safety at the call site (`data.text`).
- Avoids `as any`, avoids `@ts-expect-error`, no eslint-disable beyond a possible `no-require-imports` line if the project's lint config flags it.

If lint complains: add a single targeted `// eslint-disable-next-line @typescript-eslint/no-require-imports` directly above the line.

## Issue 2 — Mobile Navigation

### Breakpoint

Tailwind's `md` (`min-width: 768px`) is the boundary. Below 768px → mobile drawer. At/above → existing fixed sidebar.

### Component changes

**`components/NavBar.tsx`** becomes a client component with:

- `useState<boolean>` for `isOpen` (default `false`).
- A **mobile top bar** (`md:hidden`, `fixed top-0 inset-x-0 h-12 z-30`) containing:
  - Hamburger button on the left (`aria-label="Open navigation"`, `aria-expanded={isOpen}`).
  - "MyNewTerm Helper" title centered or left-aligned next to it.
- The **sidebar** (`<aside>`) keeps its existing markup and styling but gets responsive classes:
  - Mobile: `fixed inset-y-0 left-0 w-[260px] z-50 transform transition-transform duration-200 ease-out` with `-translate-x-full` when closed and `translate-x-0` when open.
  - Desktop (`md:`): `md:translate-x-0 md:w-[220px]` — always visible, no transform.
  - Mobile-only ✕ close button in the top-right of the sidebar header.
- A **backdrop** (`md:hidden`) rendered only when `isOpen`: `fixed inset-0 bg-black/50 z-40`, `onClick={() => setIsOpen(false)}`.
- **Body scroll lock** when drawer is open (mobile only): toggled via a `useEffect` setting `document.body.style.overflow`.

### Behavior

- Tapping a `<Link>` does **not** close the drawer (per user decision). User dismisses via backdrop or ✕.
- Drawer state resets to closed on viewport width crossing `md` (handled implicitly by CSS — drawer hidden behind fixed sidebar at desktop sizes; state value is harmless).
- Esc key closes drawer (small bonus, easy to add via `useEffect` keydown listener).

### Layout changes

**`app/layout.tsx`**:
- Replace the inline `<div style={{ marginLeft: 220, ... }}>` with `<div className="min-h-screen ml-0 md:ml-[220px] pt-12 md:pt-0" style={{ background: "#0A0F1E" }}>`.
- `pt-12` reserves vertical space for the mobile top bar (h-12 = 48px); collapses to `pt-0` on desktop.
- Background color stays inline since it's a single arbitrary hex.

### Page-level stacking

Audit pass: open each `app/**/page.tsx` and check for:
- Hardcoded `w-[Npx]` on root containers larger than ~360px without a `max-w-full`.
- `flex` rows without `flex-wrap` or `md:` modifier that would overflow at narrow widths.
- Tables — wrap in `<div className="overflow-x-auto">` if not already.

Fix only what's actually broken at 375px width. Don't refactor for the sake of it.

## Files Modified

1. `app/api/parse-document/route.ts` — pdf-parse import fix (3-line change).
2. `components/NavBar.tsx` — mobile drawer, hamburger, backdrop, top bar.
3. `app/layout.tsx` — responsive margin + top padding.
4. Any `app/**/page.tsx` flagged by the audit — minimal targeted fixes.

## Verification

1. `npm run build` exits 0, no TS errors, no lint errors.
2. Manual smoke (or Chrome DevTools at 375px):
   - Mobile top bar visible with hamburger.
   - Tap hamburger → drawer slides in, backdrop appears.
   - Tap backdrop → drawer slides out, backdrop disappears.
   - Tap ✕ → same as backdrop.
   - Tap a nav link → navigates, drawer **stays open**.
   - Resize to ≥ 768px → drawer state irrelevant, fixed sidebar visible.
3. Desktop ≥ 768px: visually identical to current.

## Risks / Open Questions

- **`require()` in a Next.js App Router route handler**: works at runtime (Next bundles it) but is a stylistic departure from the existing dynamic `import()` for `mammoth` on the next line. The mammoth import is *not* erroring, so we leave it alone — only fix what's broken.
- **Body scroll lock**: setting `body.overflow` works but can fight with other scroll-locking code. There isn't any in this codebase, so it's safe.
- **Page audit**: scope is bounded to "fix what's actually broken at narrow widths" — won't expand into a redesign.
