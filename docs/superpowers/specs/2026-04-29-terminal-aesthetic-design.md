# Design: Terminal / Ops-Console Visual Language

**Date:** 2026-04-29
**Status:** Draft
**Scope:** Visual layer only — palette, typography, components. No changes to navigation/IA, no new features.

## Why

User reviewed three prototypes at `/preview` (Aurora glass, Terminal, Spatial) and selected **Terminal**. The aesthetic is a clean ops-console: monospace-led, hard 1px borders, dotted-grid backdrop, cyan + lime accents, bracket/prompt motifs. Distinctive and futuristic without being decorative — the feel is precise instrumentation, not sci-fi cosplay.

## Goals

1. Define the design tokens (palette, type, spacing, motion) once so every page draws from the same source.
2. Define the reusable component shapes (panels, inputs, buttons, status, tables, modals) so each page can be migrated mechanically.
3. Keep the navigation (sidebar + mobile drawer) as it is — only restyle it to match the new language.

## Non-Goals

- Information architecture / page restructuring.
- Adding features, dashboards, or new pages.
- Animation flourishes beyond the existing cursor blink.
- Dark/light theme toggle — terminal is always dark.

## Tokens

### Palette

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#04070C` | Page background |
| `--bg-panel` | `rgba(0,0,0,0.40)` | Panels, cards, inputs |
| `--bg-row-hover` | `rgba(34,211,238,0.05)` | Row / item hover |
| `--border-primary` | `rgba(34,211,238,0.20)` | Default borders, dividers |
| `--border-strong` | `rgba(34,211,238,0.30)` | Card borders, elevated panels |
| `--border-focus` | `rgba(132,204,22,0.50)` | Input focus, primary buttons |
| `--text-primary` | `#A7F3D0` | Default body text |
| `--text-strong` | `#FFFFFF` | Headings, primary values |
| `--text-muted` | `#6B7280` | Captions, hints, comments |
| `--text-comment` | `#4B5563` | Code-comment-style labels (`// ...`) |
| `--accent-cyan` | `#22D3EE` (display: `#67E8F9`) | Section markers, prompts, links |
| `--accent-lime` | `#84CC16` (display: `#A7F3D0`) | Primary CTA, success, key values |
| `--accent-amber` | `#FCD34D` | Warnings, drafting status |
| `--accent-red` | `#FCA5A5` | Errors, unsuccessful status |

Background grid: `radial-gradient(rgba(34,211,238,0.08) 1px, transparent 1px)` at `24px 24px`, applied at the page-shell level.

### Typography

- **Display + body:** `var(--font-geist-mono)` everywhere. (Geist Mono is already loaded — `app/layout.tsx` does this. The current `body { font-family: Arial, … }` rule in `app/globals.css` must be removed/replaced.)
- **Sizing scale:** `text-[10px]` (labels) · `text-xs` (12) · `text-sm` (14) · `text-base` (16) · `text-2xl` / `text-3xl` (page titles).
- **Tracking:** label/uppercase tokens use `tracking-[0.2em]`. Headings use `tracking-tight`.
- **Case:** uppercase for section labels and metadata, lowercase for prompts and "code-y" labels, sentence case for user-facing copy in panels.

### Spacing & shape

- **Corners:** **none.** Sharp rectangles for every panel, card, input, button, badge. (No `rounded-*`.)
- **Borders:** `1px solid var(--border-primary)` default. Hover/active escalates to `--border-strong`. Focus rings use `--border-focus`.
- **Container:** `max-w-[1100px]` centered; horizontal padding `px-5` mobile, `px-6` md+. Vertical rhythm in 4 / 8 / 16 / 24 px steps.

### Motion

- Transitions on color/border only, `150ms ease-out`. No layout shifts on hover.
- Single global animation: blinking cursor (`@keyframes preview-blink`, already in `app/preview/preview.css` — promote to globals).

## Component primitives

These live in a new `components/term/` folder and are imported by the page files.

### `<TermShell>` — page-level wrapper

Wraps each page's content with the dotted-grid background, max-width container, and prompt header.

```tsx
<TermShell prompt="./profile">
  {/* page content */}
</TermShell>
```

Renders:
- Dotted-grid background.
- Top prompt row: `user@mynewterm ~ $ ./<prompt>` + blinking cursor.
- `max-w-[1100px]` content container.

### `<TermPanel>` — bordered card

Replaces `rounded-2xl border bg-white/5` patterns.

```tsx
<TermPanel title="profile :: details">
  {/* form, table, etc. */}
</TermPanel>
```

Renders a 1px-cyan-bordered rectangle with optional `▸ TITLE` header bar in `tracking-[0.2em] uppercase`.

### `<TermStat>` — labelled number

```tsx
<TermStat label="Interviews" value={3} />
```

Mirrors the preview: `▸ LABEL` micro-label, then `[ 03 ]` value in lime.

### `<TermInput>`, `<TermTextarea>`, `<TermSelect>`

- Background: `--bg-panel`.
- Border: `--border-primary`; focus: `--border-focus` + `outline: none`.
- Sharp corners, mono font, `text-sm`, padding `px-3 py-2` (input) or `px-3 py-3` (textarea).
- Label rendered above as `// label` in `--text-comment`.

### `<TermButton>` — variants

- `primary` — lime border + lime/10 fill, `[+] LABEL` style text.
- `secondary` — cyan border + transparent fill.
- `danger` — red border + red/10 fill.
- All sharp-cornered, uppercase `tracking-[0.18em]`, `text-xs font-bold`.

### `<TermStatusTag>`

Replaces `badgeStyles()` from [app/page.tsx:30](app/page.tsx) and [app/tracker/page.tsx:28](app/tracker/page.tsx).

Renders `[ DRAFTING.. ]` etc. in monospaced fixed-width form, color from accent palette. Width is consistent across statuses so columns align.

### `<TermTable>` — bordered tabular list

Used for the tracker and library pages. Header row in `bg-cyan-400/5` with `tracking-[0.2em]` uppercase column labels. Data rows `border-b border-cyan-400/10`, hover `bg-cyan-400/5`.

### `<TermModal>`

Replaces the inline modal in [app/apply/page.tsx](app/apply/page.tsx). Black/80 backdrop, sharp `--border-strong` panel, prompt-style header `> save statement`.

## Files Modified

| File | Change |
|---|---|
| `app/globals.css` | Remove `body { font-family: Arial }` override. Move blink keyframes here. Add CSS variables for the palette. |
| `components/term/*` | New folder — primitives listed above (~8 small files). |
| `components/NavBar.tsx` | Restyle: monospace, sharp corners, cyan/lime accents, brackets around active item. Behavior unchanged. |
| `app/layout.tsx` | Set `--bg-base` background, replace inline color. |
| `app/page.tsx` | Migrate Dashboard to `<TermShell>` + primitives. |
| `app/profile/page.tsx` | Migrate form to `<TermInput>` etc. |
| `app/tracker/page.tsx` | Migrate to `<TermTable>` + `<TermStatusTag>`. |
| `app/apply/page.tsx` | Migrate form, generation panel, save modal. |
| `app/critique/page.tsx` | Migrate. |
| `app/library/page.tsx` | Migrate. |
| `app/research/page.tsx` | Migrate. |
| `app/preview/*` | **Delete** — throwaway prototype. |

## Out of scope

- Restructuring the sidebar items, adding new pages, command-K palette, breadcrumbs.
- Replacing the API/data layer or adding new fields.
- Accessibility audit beyond preserving existing `aria-label`s — no regression, no new initiative.

## Risks

- **Monospace fatigue on long-form text** — the personal statement editor renders user-written prose. Plan: keep editor textarea in mono (consistent), but allow body of generated statements in `var(--font-geist-sans)` if it reads worse than expected. Decide during the apply-page migration with user input.
- **Status tag width** — `[ UNSUCCESS  ]` is wider than `[ OFFER ★    ]`; column alignment depends on padded fixed-width strings. Keep all tags the same string length.
- **Color-blind safety** — drafting (amber) vs offer (lime) vs interview (lime) all sit in the same warm range. Add a one-letter prefix or icon glyph if testing reveals confusion.

## Verification

1. `npm run build` succeeds.
2. Walk through each migrated page at 1280px and 375px in DevTools — every page reads as the same visual language, no rounded corners or Arial fallback anywhere.
3. Compare side-by-side with the `/preview` Terminal mock — final pages should feel like a direct extension of it.
