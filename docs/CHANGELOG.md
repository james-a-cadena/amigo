# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Household Management** (Phase 13)
  - Server action `updateHouseholdName` with Zod validation (min 2 chars)
  - `RenameHouseholdDialog` component with pencil icon trigger
  - Editable household name on Settings page

- **Personal Debt Privacy** (Phase 14)
  - Added `userId` column to `debts` table for per-user ownership
  - Debts are now private to the user who created them
  - Updated all debt queries and mutations to filter by `userId`
  - Household members cannot see each other's financial data

- **Settings Page Enhancements** (Phase 12)
  - Household Info card with editable name and read-only ID
  - Theme Preference toggle (Light/Dark/System)
  - App Info card with version (v0.1.0) and logged-in user details
  - Hydration-safe `SettingsThemeToggle` component

- **Dark Mode Support** (Phase 10)
  - `next-themes` integration with system preference detection
  - Theme toggle in navigation bar dropdown
  - CSS variables for consistent theming across all components

- **Global Confirmation System** (Phase 11)
  - Reusable `AlertDialog` component from Shadcn/UI
  - Delete confirmations for debts and grocery items
  - Consistent styling with CSS variable overrides for Radix portals

- **Authelia OIDC Integration**: Complete authentication flow using OpenID Connect with PKCE
  - Login route (`/api/auth/login`) with PKCE code challenge generation
  - Callback route (`/api/auth/callback`) handling token exchange and user provisioning
  - Logout route (`/api/auth/logout`) with session cleanup
  - Session management using Valkey (Redis) with 7-day TTL
  - Middleware protecting all routes except public paths

- **User Provisioning**: Automatic user and household creation on first login
  - Creates user record with `authId`, `email`, and `name` from OIDC claims
  - Creates default household for new users
  - Updates user info on subsequent logins if changed in Authelia

- **Dev/Prod Hybrid Environment**: Side-by-side deployment of both environments
  - Production: `amigo.cadenalabs.net` (port 3000)
  - Development: `dev-amigo.cadenalabs.net` (port 3001)
  - Shared PostgreSQL (separate databases: `amigo` and `amigo_dev`)
  - Shared Valkey for sessions
  - Caddy reverse proxy with DNS-01 SSL via Cloudflare

- **Docker Configuration**
  - `.dockerignore` to prevent node_modules conflicts during builds
  - PostgreSQL init script for development database creation
  - Host network mode for web containers (required for Authelia connectivity)

### Fixed

- **OIDC Redirect URI Mismatch**: Changed from build-time `NEXT_PUBLIC_APP_URL` to runtime `APP_URL` environment variable
- **Container Hostname in Redirects**: Use `getAppUrl()` instead of `request.url` to avoid internal Docker hostnames (e.g., `0.0.0.0:3000`)
- **openid-client URL Parameter**: Construct proper `URL` object for `authorizationCodeGrant` instead of passing `NextURL`
- **Missing Email Claims**: Fetch from userinfo endpoint instead of relying solely on ID token claims
- **Docker Network Isolation**: Switched web containers to host network mode to reach external Authelia server

### Dependencies

- Added `openid-client` ^6.1.7 for OIDC client
- Added `ioredis` ^5.6.1 for Valkey/Redis session storage
