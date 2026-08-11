# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Pocket Heist" — a Next.js (App Router) starter app for the Claude Code Masterclass. Tagline: "Tiny missions. Big office mischief."

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:3000)
npm run build     # production build
npm run lint      # eslint
npm test          # run all tests (vitest)
npm test path/to/file.test.tsx   # run a single test file
```

There is no separate watch-mode script — vitest handles rerun behavior itself.

## Architecture

### Route groups
`app/` uses two Next.js route groups with different layouts:
- `(public)` — unauthenticated pages (`/`, `/login`, `/signup`, `/preview`). Layout wraps children in `<main className="public">` with no nav.
- `(dashboard)` — authenticated pages (`/heists`, `/heists/create`, `/heists/[id]`). Layout renders the shared `Navbar` component above `{children}`.

The root `/` page (`app/(public)/page.tsx`) is a splash page intended to redirect based on auth state (logged in → `/heists`, logged out → `/login`) — this redirect logic is not yet implemented.

### Component convention
Each component lives in its own folder under `components/`:
```
components/ComponentName/
  ComponentName.tsx
  ComponentName.module.css   (if custom styles are needed beyond Tailwind utilities)
  index.ts                  → export { default } from './ComponentName'
```
Import via the barrel: `import ComponentName from "@/components/ComponentName"`. The `@/*` path alias maps to the project root (see `tsconfig.json`).

Style: no semicolons. Prefer Tailwind utility classes and the theme tokens defined in `app/globals.css` (`--color-primary`, `--color-secondary`, `--color-dark`, `--color-light`, `--color-lighter`, `--color-success`, `--color-error`, `--color-heading`, `--color-body`) over hardcoded colors. Use a CSS Module only when Tailwind utilities aren't sufficient (see `Navbar.module.css` for the pattern).

Shared layout utility classes from `globals.css` used across pages: `.page-content`, `.center-content`, `.form-title`.

### New UI components: TDD workflow
When building a new component, follow the pattern in `.claude/commands/component.md`:
1. Write `tests/components/[ComponentName].test.tsx` first (2-3 simple tests: renders, key elements present).
2. Run the test and confirm it fails.
3. Implement the component under `components/[ComponentName]/`.
4. Run the test again and confirm it passes.
5. Add a labeled section to `app/(public)/preview/page.tsx` showcasing the new component.

### Testing
- Vitest + `@testing-library/react` + `jsdom`, configured in `vitest.config.mts` (globals enabled, setup file `vitest.setup.ts` registers `@testing-library/jest-dom`).
- Test files live under `tests/`, mirroring the `components/` structure (e.g. `tests/components/Navbar.test.tsx`).
- Path alias `@/*` is resolved in tests via `vite-tsconfig-paths`.

### Specs and plans workflow
This repo uses slash commands (`.claude/commands/`) to formalize feature work:
- `/spec-v1`, `/spec-v2-with-figma`, `/spec-v3-with-figma-agent` — turn a short feature idea into a spec file under `_specs/` (following `_specs/template.md`) and a new branch named `claude/feature/<slug>`. These commands require a clean working tree before branching.
- `/component` — TDD workflow for creating a single new UI component (see above).
- `/code-review` — runs `a11y-reviewer` and `code-quality-reviewer` subagents in parallel over the current diff (staged + unstaged) and proposes an edit plan before making changes.
- `/commit-message-v1`, `/commit-message-v2` — generate commit messages from staged changes.

Plans derived from specs are saved under `_plans/`.




