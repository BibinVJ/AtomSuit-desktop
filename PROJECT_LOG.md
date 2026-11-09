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

## 2026-11-09 — Merge origin/develop: Vite 7, multi-tenancy, and a stale test corrected
- **Type:** chore/fix
- **What / Why:** `develop` had diverged — 2 local commits against 8 on the remote. Merged.
  Three files conflicted: `AGENTS.md`, `package.json`, `package-lock.json`.
- **The one that mattered: the remote upgraded Vite 5 → 7.** Vitest was pinned to **v2
  specifically because this project was on Vite 5**, and Vitest 2 peer-depends on Vite 5 — so
  "keep both sides" would have produced an unresolvable tree. Vitest and `@vitest/coverage-v8`
  moved to **^3.2.4** to match. Shared dev dependencies took the remote's newer versions
  (React types 18 → 19, eslint, typescript-eslint, `@vitejs/plugin-react` 4 → 5); the test-only
  packages this branch added were kept. `package-lock.json` was regenerated rather than
  hand-merged.
- **`AGENTS.md`:** kept this branch's detailed guide (it matches the other repos' convention and
  carries the AI startup prompt and the reality check) over the remote's thinner version, then
  **corrected the claims the merge made false** — "no tenant awareness" and "no test script" were
  both true when written and are not any more. Folded in the remote's multi-tenant rules.
- **A test was passing for the wrong reason.** The characterisation test asserting `X-Tenant` was
  never sent still passed after the merge — not because the gap survived, but because the new
  interceptor only attaches the header when a tenant is in localStorage, and the test set none. It
  was documenting a gap that no longer exists, so it was replaced by three real ones (sent when
  chosen, omitted when not, picked up mid-session).
- **Impact:** `npm test` **52 passed** (was 50), `type-check` clean, `lint` unchanged (8
  pre-existing warnings, 0 errors), `npm run build` passes under Vite 7. A
  `backup/pre-merge-20261109` branch was left in place.
- **Still open:** `AddSale` computes its own totals with tax hardcoded to 0 — unchanged by the
  merge, and still needs a product decision.
- **Ref:** develop

## 2026-09-20 — Test harness + first 50 tests (repo had none)
- **Type:** test/chore
- **What / Why:** The desktop repo had no test runner and no tests. Added **Vitest** — it shares the
  existing Vite toolchain, so no separate Babel/Jest config. Pinned to **Vitest 2** because the repo
  is on Vite 5 and Vitest 3+ requires Vite 6; upgrading Vite under an Electron build was not worth
  the risk for a test harness. Separate `vitest.config.ts` (the build config sets `root: 'src'`, but
  tests also cover `electron/`), plus `vitest.setup.ts` and `test` / `test:watch` / `test:coverage`
  scripts.
  **50 tests across 6 files:** the axios client (bearer token attach/omit, 401 → logout event, no
  logout loop when `/logout` itself 401s, other errors pass through); `AuthService` (login payload,
  session vs persistent token/user storage and precedence, logout clearing local state **even when
  the server call fails** — a cashier must not stay logged in because the network dropped);
  `SaleService` and the other POS endpoints (paths, pagination/sort query, server-authoritative
  invoice number, error propagation); utils; and `VoidSaleModal` as a React component test proving
  the DOM harness works (incl. the 409 "already settled" path surfacing the server's message).
- **Refactor:** `AddSale` computed the same cart reduce **three times inline**. Extracted to
  `src/utils/cart.ts` (`cartSubtotal`, `cartLineCount`) with 7 tests covering blank rows, string
  inputs from number fields, and fractional quantities. Behaviour unchanged.
- **Two gaps documented, not fixed** (both need a decision — see the session report):
  1. **The POS computes its own totals.** `AddSale` shows `Tax (0%)` hardcoded as `subtotal * 0.00`
     and Grand Total as `subtotal * 1.00`, so the cashier sees a total that ignores tax and
     discounts entirely and will not match the invoice the backend returns. This contradicts the
     "backend owns all money math" rule. Fixing it properly needs either a server-side totals
     preview endpoint or a UI that defers the total to checkout.
  2. ~~**No `X-Tenant` header.**~~ **Closed by the merge with `origin/develop`** (`feat:added multi
     tenancy`): `src/services/api.ts` now sends `x-tenant` per request from localStorage. The
     characterisation test was replaced with three that assert the header is sent when a tenant is
     chosen, omitted when none is, and picked up mid-session without a restart.
- **Impact:** `npm run test` (50 passed), `type-check` clean, `lint` unchanged (6 pre-existing
  warnings, 0 errors, none in new files), `build` passes. The empty offline stubs
  (`electron/services/{syncService,offlineGuard,database}.ts`, 0 bytes) remain untested because
  there is nothing in them.
- **Ref:** develop

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
