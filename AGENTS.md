# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**amigo** is a household management web app (budgeting, groceries, assets, debts, calendar) deployed as a Cloudflare Worker. It uses Bun workspaces with one internal package (`packages/db` for Drizzle ORM schemas/migrations).

### Prerequisites

- **Bun v1.1.38+** is the package manager (`packageManager` field in `package.json`).
- No Docker or external databases required — Wrangler/miniflare emulates D1, KV, and Durable Objects locally.

### Key commands

All standard dev commands are in `package.json` scripts and documented in `README.md`:

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` |
| Test | `bun run test` |
| Build | `bun run build` |
| Dev server | `npx vite dev` (see below) |
| DB setup (first time) | `bun run dev:setup` |
| DB reset | `bun run dev:reset` |

### Running the dev server

The `bun run dev` script wraps the dev server in 1Password secret injection (`scripts/run-with-1password-environment.sh`). In Cloud Agent environments without 1Password CLI, **skip the wrapper** and run Vite directly:

```bash
npx vite dev
```

This requires a `.dev.vars` file in the project root with Clerk keys. Create from `.dev.vars.example`:

```bash
cp .dev.vars.example .dev.vars
```

Then fill in valid `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` values. Without valid Clerk keys, the app will serve `500 Internal Server Error` on all routes (auth middleware fails), but the Vite dev server itself will be running correctly (static assets like `/@vite/client` still serve fine).

### Local database

Run `bun run dev:setup` once to apply D1 migrations and seed. This creates `.wrangler/state/` with the local SQLite database. Use `bun run dev:reset` to wipe and re-seed.

### Architecture reference

See `docs/ARCHITECTURE.md` for detailed system design.
