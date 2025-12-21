# amigo 🥑

**A high-performance, self-hosted household management platform.**

amigo is a modern budgeting and grocery tracking application built for **Data Sovereignty** and **Speed**. It is designed to run self-hosted on a Proxmox homelab, accessible securely via Tailscale, with enterprise-grade identity management.

![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-private-blue)

## ✨ Key Features

* **🛒 Real-time Groceries:** Zero-latency "Optimistic UI" updates. Check off an item, and it updates instantly on your partner's phone via WebSockets.
* **💰 Hybrid Budgeting:**
    * **Dashboards:** Server-Rendered (RSC) for instant load times.
    * **Transactions:** Infinite-scroll lists fetched via type-safe RPC.
* **🔐 Enterprise Auth:** Integrated with **Authentik** (OIDC) for Single Sign-On, MFA, and 1Password compatibility.
* **☁️ Private Cloud:** Fully accessible via `*.cadenalabs.net` using Tailscale & Cloudflare DNS-01 challenges for valid internal SSL.

## 🛠️ Tech Stack

* **Runtime:** Bun
* **Frontend:** Next.js 15 (App Router), React 19, Tailwind v4, Shadcn/UI
* **Backend:** Hono (WebSocket Server), Next.js Server Actions
* **Data:** Postgres 17, Drizzle ORM, Valkey 8 (Redis fork)
* **Infra:** Docker Compose, Caddy, Authentik

## 🚀 Getting Started

### Prerequisites
* Docker & Docker Compose
* Bun (`curl -fsSL https://bun.sh/install | bash`)
* An Authentik instance (or use the included `docker-compose.prod.yaml` stack)

### Local Development
The project is a Monorepo managed by Turborepo.

1.  **Install dependencies:**
    ```bash
    bun install
    ```

2.  **Start the Dev Stack:**
    This spins up Postgres, Valkey, and the Next.js/Hono apps in dev mode on ports 3000/3001.
    ```bash
    make dev-up
    ```

3.  **Run Migrations:**
    ```bash
    make db-migrate-dev
    ```

4.  **Visit:** `http://localhost:3000`

## 📦 Production Deployment

amigo is designed to run on a single Proxmox VM, managing its own ingress and identity.

### Quick Deploy
SSH into your server and run:

```bash
# 1. Pull latest changes & images
# 2. Start/Restart the Production Stack (Port 3100)
# 3. Apply DB Migrations
make deploy

```

For full details on DNS, SSL, and Secrets, see [DEPLOY.md](./docs/DEPLOY.md).

### Operational Commands (Makefile)

We use a `Makefile` to standardize operations across Dev and Prod environments.

| Command | Description |
| --- | --- |
| **`make dev-up`** | Start the Development stack (Detached) |
| **`make dev-logs`** | Tail logs for Dev services |
| **`make dev-shell`** | Open a shell inside the running Dev container |
| **`make prod-up`** | Start the Production stack (Detached) |
| **`make prod-logs`** | Tail logs for Production services |
| **`make prod-shell`** | Open a shell inside the running Prod container |
| **`make db-seed-prod`** | Seed the production DB with demo data |

## 🏗️ Architecture

Amigo uses a **Hybrid Data Access Strategy**:

1. **Reads (RSC):** Server Components query Postgres directly (0ms latency, no serialization).
2. **Writes (Actions):** Server Actions mutate DB -> Publish to Valkey -> Revalidate Cache.
3. **Real-time (Signals):** Hono subscribes to Valkey -> Broadcasts to WebSockets -> Client triggers `router.refresh()`.

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the deep dive.

---

*Built with ❤️ for the Cadenas.*
