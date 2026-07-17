# Contributing to Atom Suit Desktop (POS)

Guidelines for developing the Electron POS app. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for how
it's built (and the offline-first target design) and [`AGENTS.md`](AGENTS.md) for AI-agent rules.

## Prerequisites

- Node.js v20+ (LTS recommended)
- npm v10+

## Setup

```bash
npm install
# if dependency resolution fails:
npm install --legacy-peer-deps
```

Copy `.env.example` → `.env` and set `API_BASE_URL` to your backend (default in the example is
`http://127.0.0.1:8000/api`). One build points at one backend.

## Running

```bash
npm start          # runs Vite + Electron together (dev)
```

> There is **no** `npm run dev` and **no** `npm test` script — earlier docs were wrong. Use the
> scripts that actually exist (below).

### Available scripts

| Script | Does |
|--------|------|
| `npm start` | Vite dev server + Electron (development) |
| `npm run build` | `vite build` + `tsc -p tsconfig.electron.json` |
| `npm run build:prod` | Vite build only |
| `npm run build:electron` | compile the Electron main process only |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run package` | build + `electron-builder --dir` (unpacked) |
| `npm run dist` / `dist:win` / `dist:mac` / `dist:linux` | build installers |
| `npm run publish` | build + electron-builder publish |

## Before you push

```bash
npm run lint
npm run type-check
npm run build
```

There are no automated tests yet. **Adding a test runner (Vitest) and the first tests — starting
with cart/total rendering and the sale payload — is one of the most valuable contributions you
can make.** Add a `test` script when you do.

## Coding standards

- **Thin renderer.** UI renders and calls services; the backend owns business logic and money
  math (including invoice numbers). Don't compute totals/tax client-side.
- **Reuse patterns.** Use the shared `components/{form,ui,common}` and the `src/services/api.ts`
  axios instance (NProgress + 401→logout). Don't hand-roll one-off fetch calls.
- **Permissions over roles:** `hasPermission('create-sale')`, not role checks.
- **Absolute/consistent imports** and match the existing file organization (`src/pages`,
  `src/services`, `src/context`, `src/components`).
- **Future offline work must go through IPC** — the renderer may never touch SQLite/filesystem
  directly. See [`ARCHITECTURE.md`](ARCHITECTURE.md) Part B.

## Git workflow

Follow [Conventional Commits](https://www.conventionalcommits.org/). PR titles are validated in CI.

| Type | Usage |
|------|-------|
| `feat` | new feature |
| `fix` | bug fix |
| `docs` | docs only |
| `style` | formatting |
| `refactor` | no feature/fix |
| `perf` | performance |
| `test` | tests |
| `build` | build/deps |
| `ci` | pipeline |
| `chore` | maintenance |
| `revert` | revert a commit |

Branches: `feature/<name>`, `fix/<name>`, `refactor/<name>`.

## CI/CD

- `pr-validation.yml` — on PRs: `npm ci`, `npm run lint`, `npm run type-check`, Conventional
  Commit PR-title check.
- `package-test.yml` — on push to main/staging: lint/type-check/build/package across
  ubuntu/windows/macos; uploads `dist/` artifacts.
- `release.yml` — on `v*` tags: builds and publishes a GitHub Release (**Linux targets only**
  today; `-rc.*` tags → prerelease/staging env).
