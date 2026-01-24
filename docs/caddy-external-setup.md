# External Caddy Setup Guide

This guide sets up Caddy as a reverse proxy with automatic SSL via Cloudflare DNS-01 challenge. It is designed to be followed by a Claude Code instance or human operator.

## Overview

Two Caddy instances will be deployed:

| VM | Domain | Purpose |
|----|--------|---------|
| `dev-docker-1` | `*.cadenalabs.net` | Internal services (Tailscale-only access) |
| `prod-docker-1` | `*.cadenalabs.ca` | External/production services |

Both instances use the same Docker setup, differing only in Caddyfile content.

---

## Prerequisites

Before starting, ensure you have:

1. **Docker and Docker Compose** installed on the target VM
2. **Cloudflare API Token** with `Zone:DNS:Edit` permission for the relevant domain(s)
3. **DNS records** created in Cloudflare pointing to the VM's IP (can be done after Caddy is running)

---

## Step-by-Step Setup

### Step 1: Create Directory Structure

```bash
mkdir -p ~/caddy
cd ~/caddy
```

### Step 2: Create Dockerfile

Create `~/caddy/Dockerfile` with the following content:

```dockerfile
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/cloudflare

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
```

This builds Caddy with the Cloudflare DNS plugin required for DNS-01 ACME challenges.

### Step 3: Create docker-compose.yaml

Create `~/caddy/docker-compose.yaml` with the following content:

```yaml
services:
  caddy:
    build: .
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

### Step 4: Create .env File

Create `~/caddy/.env` with your Cloudflare API token:

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

**Important:** Replace `your_cloudflare_api_token_here` with your actual token. This token must have `Zone:DNS:Edit` permission for the domain(s) you're using.

### Step 5: Create Makefile

Create `~/caddy/Makefile` with the following content:

```makefile
.PHONY: up down logs reload validate build restart

# Start Caddy
up:
	docker compose up -d

# Stop Caddy
down:
	docker compose down

# View logs (follow mode)
logs:
	docker compose logs -f

# Reload config without restart (zero downtime)
reload:
	docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# Validate config syntax before applying
validate:
	docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile

# Rebuild image (after Caddy updates or Dockerfile changes)
build:
	docker compose build --no-cache
	docker compose up -d

# Full restart
restart:
	docker compose restart
```

### Step 6: Create Caddyfile

Create `~/caddy/Caddyfile` based on which VM you're setting up.

---

## Caddyfile for dev-docker-1 (Internal - cadenalabs.net)

```caddy
{
    email admin@cadenalabs.net
}

# =============================================================================
# SNIPPETS
# =============================================================================

(cloudflare-tls) {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}

(security-headers) {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}

# =============================================================================
# INTERNAL SERVICES (cadenalabs.net)
# =============================================================================
# Add services below. Replace IP addresses with actual Tailscale or LAN IPs.

# Example service:
# service.cadenalabs.net {
#     import cloudflare-tls
#     import security-headers
#     reverse_proxy 100.x.x.x:8080
# }

# -----------------------------------------------------------------------------
# AMIGO (Development)
# -----------------------------------------------------------------------------
# Uncomment when ready to migrate amigo

# dev-amigo.cadenalabs.net {
#     import cloudflare-tls
#     import security-headers
#
#     # WebSocket and API routes -> Hono API server
#     reverse_proxy /ws <AMIGO_VM_IP>:3001
#     reverse_proxy /api/* <AMIGO_VM_IP>:3001
#
#     # Everything else -> Next.js web server
#     reverse_proxy <AMIGO_VM_IP>:3001
# }
```

---

## Caddyfile for prod-docker-1 (External - cadenalabs.ca)

```caddy
{
    email admin@cadenalabs.ca
}

# =============================================================================
# SNIPPETS
# =============================================================================

(cloudflare-tls) {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}

(security-headers) {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}

# =============================================================================
# ARR STACK
# =============================================================================
# Replace IP addresses with actual LXC/VM IPs

sonarr.cadenalabs.ca {
    import cloudflare-tls
    import security-headers
    reverse_proxy <SONARR_IP>:8989
}

radarr.cadenalabs.ca {
    import cloudflare-tls
    import security-headers
    reverse_proxy <RADARR_IP>:7878
}

prowlarr.cadenalabs.ca {
    import cloudflare-tls
    import security-headers
    reverse_proxy <PROWLARR_IP>:9696
}

bazarr.cadenalabs.ca {
    import cloudflare-tls
    import security-headers
    reverse_proxy <BAZARR_IP>:6767
}

# =============================================================================
# AMIGO (Production)
# =============================================================================
# Uncomment when ready to migrate amigo

# amigo.cadenalabs.ca {
#     import cloudflare-tls
#     import security-headers
#
#     # WebSocket and API routes -> Hono API server
#     reverse_proxy /ws <AMIGO_VM_IP>:3001
#     reverse_proxy /api/* <AMIGO_VM_IP>:3001
#
#     # Everything else -> Next.js web server
#     reverse_proxy <AMIGO_VM_IP>:3000
# }
```

---

## Step 7: Build and Start Caddy

```bash
cd ~/caddy
docker compose up -d
```

Verify it's running:

```bash
docker compose ps
docker compose logs -f
```

You should see Caddy start and begin obtaining certificates for any configured domains.

---

## Adding New Services

To add a new service:

1. **Add DNS record in Cloudflare:**
   - Type: `A`
   - Name: `servicename` (e.g., `sonarr`)
   - Content: IP address of the Caddy VM
   - Proxy status: `DNS only` (gray cloud) — Caddy handles SSL

2. **Edit the Caddyfile:**
   ```caddy
   servicename.cadenalabs.ca {
       import cloudflare-tls
       import security-headers
       reverse_proxy <SERVICE_IP>:<SERVICE_PORT>
   }
   ```

3. **Validate and reload:**
   ```bash
   make validate && make reload
   ```

---

## Common Caddyfile Patterns

### Basic Authentication

For services without built-in auth:

```caddy
service.cadenalabs.ca {
    import cloudflare-tls
    import security-headers

    basic_auth {
        # Generate hash: docker compose exec caddy caddy hash-password
        username $2a$14$hashedpasswordhere
    }

    reverse_proxy <IP>:<PORT>
}
```

### Path-Based Routing (Multiple Services on One Domain)

```caddy
media.cadenalabs.ca {
    import cloudflare-tls
    import security-headers

    handle_path /sonarr/* {
        reverse_proxy <SONARR_IP>:8989
    }

    handle_path /radarr/* {
        reverse_proxy <RADARR_IP>:7878
    }
}
```

Note: This requires the *arr apps to be configured with a base URL (e.g., `/sonarr`).

### WebSocket Support

WebSockets work automatically with `reverse_proxy`. No special configuration needed.

### Custom Error Pages

```caddy
service.cadenalabs.ca {
    import cloudflare-tls
    import security-headers

    handle_errors {
        respond "{err.status_code} {err.status_text}"
    }

    reverse_proxy <IP>:<PORT>
}
```

---

## Troubleshooting

### Check Caddy Logs

```bash
docker compose logs -f
```

### Validate Configuration

```bash
make validate
```

### Certificate Issues

If certificates aren't being issued:

1. Verify `CLOUDFLARE_API_TOKEN` is correct in `.env`
2. Verify the token has `Zone:DNS:Edit` permission
3. Verify DNS records exist in Cloudflare
4. Check Caddy logs for ACME errors

### Reload Not Working

If `make reload` fails, try a full restart:

```bash
docker compose restart
```

### View Certificate Status

```bash
docker compose exec caddy caddy list-modules | grep dns
```

---

## Migrating Amigo

When ready to migrate amigo to use external Caddy:

### On the Caddy VM:

1. Uncomment the amigo block in the Caddyfile
2. Replace `<AMIGO_VM_IP>` with the actual IP (Tailscale or LAN)
3. Run `make validate && make reload`

### On the Amigo VM:

The following changes need to be made to amigo's configuration:

1. **docker-compose.yaml:** Remove the `caddy` service and expose ports on web/api services
2. **Makefile:** Remove `caddy-prod`, `caddy-dev`, `caddy-reload` targets
3. **Optionally:** Delete `docker/caddy/` directory

These changes will be made by Claude Code when instructed.

---

## File Checklist

After setup, you should have these files in `~/caddy/`:

```
~/caddy/
├── .env                 # CLOUDFLARE_API_TOKEN
├── Caddyfile            # Service definitions
├── Dockerfile           # Caddy with Cloudflare plugin
├── docker-compose.yaml  # Container configuration
└── Makefile             # Management commands
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `make up` | Start Caddy |
| `make down` | Stop Caddy |
| `make logs` | View logs |
| `make validate` | Check config syntax |
| `make reload` | Apply config changes (zero downtime) |
| `make build` | Rebuild Docker image |
| `make restart` | Full restart |
