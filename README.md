# amigo

Self-hosted household management app for budgeting and grocery tracking.

## Tech Stack

- **Runtime:** Bun
- **Frontend:** Next.js 15, React 19, Tailwind v4, Shadcn/UI
- **Backend:** Hono (WebSockets), Next.js Server Actions
- **Database:** Postgres 17, Drizzle ORM, Valkey 8
- **Infra:** Docker Compose, Caddy, Authentik

## Development

```bash
bun install
docker compose up -d
```

Visit http://localhost:3000

## Production

```bash
make deploy
```

## Commands

| Command | Description |
| --- | --- |
| `bun install` | Install dependencies |
| `bun dev` | Start dev servers |
| `bun db:generate` | Generate migrations |
| `bun db:migrate` | Apply migrations |
| `make deploy` | Deploy to production |
