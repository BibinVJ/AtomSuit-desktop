# Atom Suit — Desktop POS

The **point-of-sale desktop application** for Atom Suit, built with **Electron**, **React**,
**Vite**, **TailwindCSS**, and **TypeScript**.

> **Branding note:** the package is still named `inventory-manager` / "Inventory Manager" from
> its origin; rebranding to Atom Suit is pending.

## 📖 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the app is built today **and** the offline-first
  target design. **Start here.**
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — setup, scripts, standards, git workflow, CI.
- **[AGENTS.md](AGENTS.md)** — rules for AI-assisted development.
- **[PROJECT_LOG.md](PROJECT_LOG.md)** — what was last implemented in this repo.

## Status (read this first)

This app is currently an **online-only** POS: the React UI calls the backend API directly. The
"offline-first" capability (local SQLite, background sync, offline guard, auto-update, secure
IPC bridge) is **planned but not yet implemented** — see ARCHITECTURE.md Part B. Do not assume
offline billing works today.

**What works now:** login, a POS billing screen (product/customer lookup, cart, backend-issued
invoice number, cash/UPI/card, save & print), a sales list with view/void, and A4 invoice
print. All require a reachable backend.

## System requirements

- Node.js v20+ (LTS recommended)
- npm v10+

## Quick start

```bash
npm install            # or: npm install --legacy-peer-deps
cp .env.example .env   # set API_BASE_URL to your backend
npm start              # runs Vite + Electron (there is NO `npm run dev`)
```

Build & package:

```bash
npm run build          # renderer + electron main
npm run dist:linux     # (or dist:win / dist:mac) build installers
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full script list and pre-push checks.

## License

MIT
