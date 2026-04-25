# pdf-parse Fix & Mobile-Friendly Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock the production build by fixing a TypeScript error in the document-parsing API route, and replace the fixed left sidebar with a responsive hamburger drawer on mobile screens while keeping the desktop sidebar unchanged.

**Architecture:** Two surgical changes. (1) Swap the dynamic `import("pdf-parse").default` for a typed `require()` since `pdf-parse` is CJS. (2) Make `NavBar` a stateful client component with a mobile top bar + slide-in drawer + backdrop, and update `app/layout.tsx` so the content margin is responsive. Audit each `page.tsx` for narrow-width bugs and fix only what actually breaks at 375px.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4. No test framework — verification is `npm run build` (compiles + type-checks) plus a manual visual smoke check at mobile width.

**Spec:** `docs/superpowers/specs/2026-04-25-pdf-parse-fix-and-mobile-nav-design.md`

---

## File Map

| File | Change |
|------|--------|
| `app/api/parse-document/route.ts` | Replace pdf-parse dynamic import with typed `require()` |
| `components/NavBar.tsx` | Add `isOpen` state, mobile top bar, hamburger button, backdrop, drawer transforms, ✕ close, body-scroll lock, Esc handler |
| `app/layout.tsx` | Replace inline `marginLeft: 220` with Tailwind responsive classes; add top padding for the mobile top bar |
| `app/**/page.tsx` (7 files) | Read all; fix hardcoded widths, non-wrapping flex rows, or overflowing tables only where they actually break at 375px |

Each task is committed independently so the diff stays reviewable.

---

## Task 1: Fix pdf-parse TypeScript error

**Files:**
- Modify: `app/api/parse-document/route.ts:27`

- [ ] **Step 1: Reproduce the error**

Run: `npm run build`
Expected: build fails with TypeScript error referencing `app/api/parse-document/route.ts` and "Property 'default' does not exist on type typeof import pdf-parse" (or similar). Confirm this is the failure before changing anything.

- [ ] **Step 2: Replace the import**

Edit `app/api/parse-document/route.ts`. Find lines 26–29:

```ts
    if (fileName.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text ?? "";
```

Replace with:

```ts
    if (fileName.endsWith(".pdf")) {
      // pdf-parse is CommonJS (module.exports = fn); dynamic import().default
      // is not declared in its type definitions. Use require() with an explicit
      // signature so the call site stays type-safe.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (
        buffer: Buffer
      ) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text ?? "";
```

Leave the `mammoth` block (line 31) untouched — it isn't erroring.

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: build succeeds, exit code 0, no TS errors. (Other warnings unrelated to this change are acceptable for now and will be re-verified at Task 5.)

If the build still fails on this file, re-read the new error — it may be a different (pre-existing) issue. Do not silence; report back.

- [ ] **Step 4: Commit**

```bash
git add app/api/parse-document/route.ts
git commit -m "Fix pdf-parse TS import error in document parser"
```

---

## Task 2: Add mobile drawer state and UI to NavBar

**Files:**
- Modify: `components/NavBar.tsx` (full rewrite of the component body — keeps all icons and `items` array as-is)

- [ ] **Step 1: Rewrite NavBar with mobile drawer**

Replace the entire contents of `components/NavBar.tsx` with the version below. The icon function components (`IconHome`, `IconUser`, `IconPlus`, `IconSearch`, `IconList`, `IconCritique`, `IconBookmark`, `IconWrap`) and `NavItem` type stay exactly as they are — only the default export changes plus two small additions (a hamburger icon and an ✕ icon).

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function IconWrap({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center">{children}</span>;
}

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCritique() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", icon: <IconHome /> },
    { href: "/profile", label: "My Profile", icon: <IconUser /> },
    { href: "/research", label: "Research", icon: <IconSearch /> },
    { href: "/apply", label: "New Application", icon: <IconPlus /> },
    { href: "/critique", label: "Critique", icon: <IconCritique /> },
    { href: "/library", label: "Library", icon: <IconBookmark /> },
    { href: "/tracker", label: "Tracker", icon: <IconList /> },
  ];

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      {/* Mobile top bar — visible only below md */}
      <div
        className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-white/10 px-3 md:hidden"
        style={{ background: "#0D1526" }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <IconHamburger />
        </button>
        <div className="text-[14px] font-extrabold tracking-tight" style={{ color: "#60A5FA" }}>
          MyNewTerm Helper
        </div>
      </div>

      {/* Backdrop — only on mobile when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop fixed, mobile slide-in drawer */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/10",
          "transform transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:w-[220px] md:translate-x-0",
        ].join(" ")}
        style={{ background: "#0D1526" }}
        aria-label="Primary navigation"
      >
        <div className="flex items-start justify-between px-4 pt-5 pb-4">
          <div>
            <div
              className="text-[15px] font-extrabold leading-tight tracking-tight"
              style={{ color: "#60A5FA" }}
            >
              MyNewTerm Helper
            </div>
            <div className="mt-1 text-[13px] font-semibold tracking-wide text-gray-400">
              Science Teacher
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 hover:bg-white/5 hover:text-white md:hidden"
          >
            <IconClose />
          </button>
        </div>

        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
                      "border-l-2",
                      isActive
                        ? "border-blue-400 text-blue-300 bg-white/5"
                        : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <IconWrap>{item.icon}</IconWrap>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 pb-4 pt-3 text-xs text-gray-500">
          Submit manually on MyNewTerm
        </div>
      </aside>
    </>
  );
}
```

Key behavior notes:
- `isOpen` only matters on mobile; on desktop (`md:`) the sidebar is always rendered visible via `md:translate-x-0`.
- The drawer does **not** close when a `<Link>` is clicked — per the spec, dismissal is via backdrop, ✕, or Esc.
- Body scroll is locked only while the drawer is open.

- [ ] **Step 2: Type-check by building**

Run: `npm run build`
Expected: build completes; no TS errors from `NavBar.tsx`. The mobile top bar will overlap content right now — that's expected and gets fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add components/NavBar.tsx
git commit -m "Add mobile hamburger drawer to NavBar"
```

---

## Task 3: Make layout responsive

**Files:**
- Modify: `app/layout.tsx:31-35`

- [ ] **Step 1: Replace inline marginLeft with responsive classes**

Edit `app/layout.tsx`. Find lines 31–35:

```tsx
      <body className="min-h-full">
        <NavBar />
        <div className="min-h-screen" style={{ marginLeft: 220, background: "#0A0F1E" }}>
          {children}
        </div>
      </body>
```

Replace with:

```tsx
      <body className="min-h-full">
        <NavBar />
        <div
          className="min-h-screen ml-0 pt-12 md:ml-[220px] md:pt-0"
          style={{ background: "#0A0F1E" }}
        >
          {children}
        </div>
      </body>
```

Why each class:
- `ml-0 md:ml-[220px]` — no left margin on mobile (drawer is an overlay, not part of layout), 220px on desktop to clear the fixed sidebar.
- `pt-12 md:pt-0` — reserve 48px (h-12) for the mobile top bar; remove on desktop where there's no top bar.
- Background color stays inline; it's a single arbitrary hex.

- [ ] **Step 2: Build and verify visually**

Run: `npm run build`
Expected: build succeeds.

Then run: `npm run dev` (in another terminal) and open `http://localhost:3000`. In Chrome DevTools, toggle the device toolbar to a 375px-wide preset (iPhone SE):
- Top bar visible with hamburger + title.
- Tap hamburger → drawer slides in from the left, backdrop appears, page content does not shift.
- Tap backdrop or ✕ → drawer closes.
- Press Esc with drawer open → drawer closes.
- Tap a nav link → page navigates, drawer **stays open**.
- Resize to ≥ 768px → top bar disappears, fixed sidebar visible, content has 220px left margin, no visual regression vs. before.

If any of those checks fail, stop and report what you saw — do not proceed to Task 4.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "Make root layout responsive for mobile nav drawer"
```

---

## Task 4: Audit pages for narrow-width issues

**Files:**
- Read all: `app/page.tsx`, `app/profile/page.tsx`, `app/research/page.tsx`, `app/apply/page.tsx`, `app/critique/page.tsx`, `app/library/page.tsx`, `app/tracker/page.tsx`
- Modify any whose root containers break at 375px width

This task fixes ONLY pages that visibly break. Don't refactor pages that already stack acceptably.

- [ ] **Step 1: Read each page and inventory potential issues**

Open each `page.tsx` listed above. For each, scan for:
1. Hardcoded width on the outermost wrapper: `w-[Npx]`, `min-w-[Npx]`, or inline `style={{ width: ... }}` where N > 360.
2. Top-level `flex` rows without `flex-col md:flex-row`, `flex-wrap`, or a `md:` modifier — these will overflow horizontally on mobile.
3. `<table>` elements not wrapped in `<div className="overflow-x-auto">`.
4. Grids with `grid-cols-N` where N > 1 and no responsive variant — these may be acceptable if columns are narrow enough, but check at 375px.

Make a short list (in your head or a scratch note) of which pages need touching and what to change.

- [ ] **Step 2: Apply fixes**

For each issue identified, apply the smallest fix:

| Issue | Fix |
|-------|-----|
| `w-[800px]` on root container | Change to `w-full max-w-[800px]` |
| `<div className="flex gap-6">` (row that overflows) | Change to `<div className="flex flex-col gap-6 md:flex-row">` |
| `<table>` without scroll wrapper | Wrap: `<div className="overflow-x-auto"><table>...</table></div>` |
| `grid-cols-3` that breaks at 375px | Change to `grid-cols-1 md:grid-cols-3` (or `sm:grid-cols-2 md:grid-cols-3`) |

If a page already uses responsive classes correctly, do not touch it. Use the Edit tool — do not rewrite whole files.

- [ ] **Step 3: Verify in DevTools at 375px**

With `npm run dev` running, click through each page at 375px width:
- `/` (Dashboard)
- `/profile`
- `/research`
- `/apply`
- `/critique`
- `/library`
- `/tracker`

For each, confirm: no horizontal scroll on the page itself (table scroll is OK), text is readable, buttons reachable. If a page still overflows, return to Step 2 for that page.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds, no new TS or lint errors.

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "Stack page layouts on small screens"
```

If no pages needed changes, skip the commit and note that in your handoff. Report which pages (if any) you changed.

---

## Task 5: Final verification

- [ ] **Step 1: Clean build from scratch**

Run: `npm run build`
Expected: exit code 0, "Compiled successfully" (or Next.js equivalent), zero TypeScript errors, zero blocking lint errors. Pre-existing warnings unrelated to this work are acceptable but should be noted.

- [ ] **Step 2: Re-confirm mobile and desktop**

With `npm run dev`, do one final pass:
- 375px width: top bar + hamburger work, drawer opens/closes via backdrop/✕/Esc, all 7 nav links navigate, all pages stack cleanly.
- 1280px width: layout identical to pre-change state — fixed sidebar on left, 220px content margin, no top bar.

- [ ] **Step 3: Report**

Summarize: which files were modified, build result, and any pages that needed stacking fixes vs. which were already responsive. The user explicitly asked for the build to pass before finishing — do not declare done until Step 1 passes.

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers Issue 1. Tasks 2–4 cover Issue 2 (drawer + responsive layout + page audit). Task 5 covers the user's "run npm run build to confirm no errors before finishing" requirement.
- **No placeholders:** Each step has the actual code or command to run.
- **Type consistency:** `isOpen` / `setIsOpen` used uniformly. `pdfParse` typed as `(buffer: Buffer) => Promise<{ text: string }>` matches the call site `pdfParse(buffer)` and field access `data.text`.
- **Bounded scope:** Page audit explicitly limited to pages that break at 375px; no refactor creep.
