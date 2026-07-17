# Desktop (POS) Project Log

What was implemented in the **Atom Suit desktop POS**, most recent first. Read the top of this
file to catch up before starting work; append an entry when you finish anything non-trivial.

## How to use
- **Newest on top.** One entry per significant change (feature, decision, gnarly fix). Skip
  trivia `git log` already covers well.
- Keep it short; one line of *why* beats ten of *what*.
- Record significant or hard-to-reverse **decisions here too** (`Type: decision`, with rationale +
  any revisit trigger). No separate decision/ADR files — the log is the record.
- Entry format:
  ```
  ## YYYY-MM-DD — <title>
  - **Type:** feat | fix | refactor | decision | chore | docs
  - **What / Why:** ...
  - **Impact:** breaking changes, follow-ups
  - **Ref:** commit / PR / branch
  ```

---

# Log

## 2026-07-17 — Repo documentation baseline
- **Type:** docs
- **What / Why:** Added `AGENTS.md`, `ARCHITECTURE.md` (current online-only reality + the
  offline-first "Independent Node" target design), `CONTRIBUTING.md`, corrected `README.md`
  (removed false offline/SQLite/sync claims and wrong `npm run dev`/`npm test` scripts), and
  started this log.
- **Impact:** No code change. The app is online-only today; offline is a documented target, not
  built. Use `npm start`.
- **Ref:** develop

## 2025-09-10 — Start & packaging fixed
- **Type:** fix
- **What / Why:** Fixed `npm start` and the electron-builder packaging/release flow (Linux
  trace/breakpoint trap resolved).
- **Ref:** commit `start and package fixed`

---

## Recent history (seeded from git, for context)

| Date | Change |
|------|--------|
| 2025-09-10 | start and package fixed; build fix |
| 2025-09-07 | fix: resolve trace/breakpoint trap error on Linux; release fix |
| 2025-09-04 | multiple release/packaging fixes |

> Note: the desktop repo has been dormant since 2025-09 — the online-only POS billing flow and
> A4 print work; offline-first has not been started (see `ARCHITECTURE.md` Part B).

<!-- Add new entries above the "Recent history" section. -->
