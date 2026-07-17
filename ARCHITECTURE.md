# Desktop (POS) Architecture

The Electron point-of-sale app for Atom Suit. This document describes **what exists today** and
the **target offline-first design**, clearly separated so no one mistakes the plan for reality.

---

## Part A — Current architecture (as built)

An **online-only** POS. The React renderer talks straight to the backend API over HTTPS; there
is no local persistence beyond the auth token.

```
┌───────────────────────── Electron ─────────────────────────┐
│  Main process (electron/main.ts)                            │
│   • creates BrowserWindow, app menu, disables Ctrl+R        │
│   • loads Vite dev server (dev) or dist/renderer (prod)     │
│   • NO preload wired, NO ipcMain handlers, NO DB, NO sync   │
│                                                             │
│  Renderer (src/, React + Vite)                              │
│   main.tsx → ThemeProvider → AuthProvider → App             │
│   HashRouter: /signin, /add-sale, /sales                    │
│        │                                                    │
│        ▼  axios (src/services/*.ts)                         │
└────────┼────────────────────────────────────────────────────┘
         │ HTTPS  Authorization: Bearer <token>
         ▼
   Backend API  (API_BASE_URL from .env; one build = one backend)
```

### Layout (real)
- `electron/main.ts` — window + menu (minimal, real).
- `electron/preload.ts`, `electron/ipcHandlers/{auth,customers,items,sales}.js`,
  `electron/services/api.js` — **dead code** (preload never loaded; handlers never registered).
- `electron/services/{database,syncService,offlineGuard}.ts`, `electron/utils/utils.ts` —
  **empty files (0 bytes)**.
- `src/main.tsx`, `src/App.tsx`, `src/router/index.tsx` (HashRouter).
- `src/pages/{AuthPages/SignIn, Sales/AddSale, Sales/Sales}.tsx` — the three real screens.
- `src/services/{api,AuthService,CustomerService,ItemService,SaleService,ProfileService,
  PermissionService}.ts` — axios data layer → backend.
- `src/context/{AuthContext,ThemeContext}.tsx`; hooks `useAuth/useModal/usePermissions/useTheme`.
- `src/components/{sales,customer,auth,form,ui,common,header}`; `src/types/*`.
- `print/utils/printService.ts` (server-render React → new window → `window.print()`),
  `print/invoices/InvoiceA4.tsx` (used), `print/invoices/InvoiceThermal.tsx` (unused).

### Known inaccuracies vs. old README
- `src/modules/` is empty; there is no `src/store/` or `src/api/` (services live in `src/services`).
- `npm run dev` and `npm run test` do **not** exist — use `npm start`; there are no tests.
- The "secure IPC bridge (UI never touches network directly)" is inverted today — the renderer
  calls the network directly.

### Build & packaging
- Vite builds the renderer to `dist/renderer`; `tsc -p tsconfig.electron.json` compiles
  `electron/**` → `dist/` (`dist/main.js`).
- `electron-builder.config.cjs`: appId `com.bibin.inventorymanager`, targets Windows (NSIS),
  macOS (DMG x64+arm64), Linux (AppImage/deb/rpm). CI `release.yml` currently ships **Linux only**.

---

## Part B — Target architecture (offline-first "Independent Node" — NOT built)

The product goal: **bill at the counter with or without internet, and never lose a sale.** The
intended model treats each terminal as an autonomous node with local truth that reconciles to
the cloud.

```
┌───────────────────────── Electron ─────────────────────────┐
│  Renderer (UI)  ──IPC──▶  Main process                      │
│                            • database.ts  → SQLite (local truth)
│                            • syncService.ts → push outbox / pull masters
│                            • offlineGuard.ts → tenant offline-time limit
│                            • updater.ts → electron-updater                │
└──────────────────────────────┬─────────────────────────────┘
                               │  when online (auto or manual "Sync")
                               ▼
                         Backend API (idempotent ingest + device-license auth)
```

### Design principles to implement
1. **Local SQLite is the terminal's source of truth** for sales. A sale is written locally and
   succeeds instantly, online or not.
2. **Append-only outbox + idempotent server ingest.** Each sale carries a stable
   `device_id + local_id` idempotency key so retries after flaky networks never double-post.
3. **Server-authoritative invoice numbering.** The terminal may hold a *provisional* local
   number; the backend assigns the *canonical* invoice number on sync. Never let a client mint a
   number that reaches the ledger unchallenged.
4. **Pull masters** (items, prices, stock snapshots, customers, tax) on sync so offline lookups
   work.
5. **Conflict handling.** Sales are append-only (low conflict); master data is
   server-wins on pull. Surface any rejected/failed syncs to the cashier.
6. **Secure IPC only.** The renderer must never touch SQLite or the filesystem — everything goes
   through the preload `contextBridge` + `ipcMain.handle`. (Wire the existing preload/handlers,
   which are currently dead.)
7. **Tenant + device identity.** The app must know its tenant (send `X-Tenant`) and authenticate
   as a provisioned **device license** (see backend `device_licenses` — the API for this still
   needs to be built). Enforce the plan's `device_limit` and the offline-time-limit guard.
8. **Auto-update** via `electron-updater` (`updater.ts`) so terminals stay current.

### Suggested build order
1. Wire preload + IPC properly (renderer → main for all data). No behaviour change, just the
   secure boundary.
2. Add SQLite + repositories in the main process; read masters from local cache.
3. Write sales to SQLite first; add the outbox.
4. Build `syncService` (push outbox with idempotency keys, pull masters); add manual + auto sync.
5. Add tenant/device identity + `device_licenses` API (backend) + `offlineGuard`.
6. Add `updater.ts`; enable thermal receipt printing; add barcode input.

See the workspace-level gap analysis for how this fits the wider roadmap.
