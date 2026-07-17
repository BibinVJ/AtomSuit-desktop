# Desktop Agent Guide

This repository is the **Electron point-of-sale (POS) desktop app for Atom Suit**. Read this
file, then [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).

> ⚠️ **Reality check.** Despite the original README's "offline-first" framing, this app is
> currently an **online-only** React POS that calls the backend API directly over HTTP via
> axios. The Electron "offline" pieces are **not implemented**:
> `electron/services/{database,syncService,offlineGuard}.ts` are **empty files**, and
> `electron/preload.ts` + `electron/ipcHandlers/*` are **dead code** (the preload is never
> loaded and no `ipcMain.handle` is registered). Do **not** assume offline, SQLite, sync, IPC,
> tenancy, or auto-update work. The target offline design is in [`ARCHITECTURE.md`](ARCHITECTURE.md).

## AI startup prompt (paste at the start of an AI session)

```
You are working on the Atom Suit DESKTOP POS — Electron 38 + React 18 + Vite + TypeScript +
Tailwind v3. It is currently ONLINE-ONLY: the renderer calls the backend API directly via axios
(src/services/*). The electron/ offline services (database.ts, syncService.ts, offlineGuard.ts)
are EMPTY stubs; preload.ts and ipcHandlers/* are DEAD code (preload never loaded, no
ipcMain.handle). There is no local DB, no sync, no tenant awareness, no device licensing, no
auto-updater. Read AGENTS.md, ARCHITECTURE.md, and the recent PROJECT_LOG.md entries first (so
you don't undo or duplicate recent work). Rules:
1. The backend owns all business logic and money math — the POS sends inputs and renders the
   backend's numbers (invoice number comes from the backend).
2. Run it with `npm start` (there is NO `npm run dev` and NO test script). Build: `npm run build`.
3. Match existing structure: screens in src/pages, data in src/services (axios → backend),
   shared UI in src/components, auth via AuthContext + hasPermission(). HashRouter is used.
4. If asked to add OFFLINE support, follow the Independent-Node target design in ARCHITECTURE.md
   (local SQLite outbox + idempotent server sync + server-authoritative invoice numbers). Wire
   the preload/IPC properly (renderer must NOT touch the DB directly). Do NOT pretend offline
   already works.
Before finishing: npm run lint · npm run type-check · npm run build. Append an entry to
PROJECT_LOG.md (newest on top: date, type, what/why, impact, ref).
```

## Stack

- Electron 38 (main process in `electron/`, compiled by `tsc`)
- React 18 + Vite + TypeScript (renderer in `src/`)
- Tailwind CSS v3
- axios (data layer → backend API), React Context (`AuthContext`, `ThemeContext`) — no Zustand/Redux
- `react-router` v7 as `HashRouter`; `sonner` toasts; `lucide-react` icons

## What actually works today

- Login (online, token in `localStorage`/`sessionStorage`).
- POS billing screen (`src/pages/Sales/AddSale.tsx`): product lookup (search select), cart with
  live stock display + client-side validation, customer select/add/edit, backend-issued invoice
  number, cash/UPI/card payment, Save / Save & Print → `addSale` POST.
- Sales list/history with view + void, permission-gated.
- A4 invoice print via `window.print()` (`print/utils/printService.ts`, `print/invoices/InvoiceA4.tsx`).

## What does NOT exist yet (don't assume)

- Offline storage / local DB (no SQLite dependency; `database.ts` empty).
- Sync engine / offline queue / conflict resolution (`syncService.ts` empty).
- Offline time-limit guard (`offlineGuard.ts` empty).
- Tenant awareness (no `X-Tenant`; one build points at one backend via `.env` `API_BASE_URL`).
- Device/terminal licensing or provisioning.
- Auto-update (`electron-updater` installed but unused; no `updater.ts`).
- Thermal receipt printing (`InvoiceThermal.tsx` exists but is never imported).
- Barcode scanner, product-grid tiles, delivery-note UI.
- Any tests (no runner, no `test` script).

## Working conventions

- Keep the renderer thin — it renders and calls services. All authoritative logic is backend-side.
- Reuse the shared `form/`, `ui/`, and `common/` components and the service/axios pattern in
  `src/services/api.ts` (NProgress + 401→logout interceptor).
- Authorize UI with permissions (`hasPermission('create-sale')`), not roles.
- **Security invariant for future offline work:** the UI must never touch SQLite or the
  filesystem directly — go through the preload/IPC bridge (which must actually be wired first).
- Match existing patterns before adding new ones.

## Validation (run before finishing)

- `npm run lint`
- `npm run type-check`
- `npm run build`

(There is no test script yet — adding one, and the first tests, is high-value.)
