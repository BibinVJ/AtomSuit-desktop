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
  2. **No `X-Tenant` header.** `src/services/api.ts` never sends it, so one build cannot serve
     multiple tenants (desktop tenant-awareness is a Phase 2 item). A characterisation test records
     the current behaviour and is written to fail once tenancy lands, as the reminder to update it.
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
