# WoodCutter Dashboard

Cloudflare-hosted revenue + marketing dashboard for WoodCutter venues.

```
                      ┌─────────────────────────────┐
                      │  Cloudflare Cron             │
                      └──────────────┬──────────────┘
                                     ▼
       ┌─────────────────────────────────────────────────┐       ┌──────────────────┐
       │  workers/refresh                                 │ ────► │ Stripe (9 acct)  │
       │  fan-out, partial-success, scrubs secrets        │ ────► │ Odoo XML-RPC (6) │
       │  writes pre-aggregated payloads to KV            │ ────► │ Viva Wallet      │
       └──────────────────────────┬──────────────────────┘ ────► │ Supermetrics     │
                                  │                              └──────────────────┘
                                  ▼
                                ┌────┐
                                │ KV │
                                └────┘
                                  ▲
   user (CF Access · Google SSO)  │
        │                         │
        ▼                         │
   ┌──────────┐  fetch /api/*  ┌──────────────────────┐
   │  Pages   │ ─────────────► │ workers/api          │
   │  (React) │ ◄──── JSON ─── │ JWT validated        │
   └──────────┘                └──────────────────────┘
```

**One repo, three deployable units (api Worker, refresh Worker, Pages app) + one shared TS package.**

## Quick links

- [Repo layout](#repo-layout)
- [Local dev](#local-dev)
- [Cloudflare deploy](#cloudflare-deploy)
- [Cutover from old system](#cutover-checklist)
- [Security obligations](#security-obligations)

---

## Repo layout

```
woodcutter-dashboard/
├─ apps/web/                    # Vite + React + recharts (Cloudflare Pages)
│  └─ src/{routes,components,lib}
├─ workers/
│  ├─ api/                      # GET /api/*  (KV reads only, JWT-validated)
│  └─ refresh/                  # Cron — calls upstream APIs, writes KV
├─ packages/shared/             # Types, VAT, targets, ISO, Belgium split
├─ scripts/parity/              # Compare old CSVs vs new Worker JSON
└─ pnpm-workspace.yaml
```

Imported by both Worker and dashboard from `@woodcutter/shared` — single source of truth for VAT divisors, annual targets, the Belgium → Brussels/Anvers split rule, and all data shapes.

---

## Local dev

```bash
pnpm install
pnpm dev:refresh      # wrangler dev on port 8788 — runs the cron Worker locally
pnpm dev:api          # wrangler dev on port 8787 — serves /api/*
pnpm dev:web          # vite on port 5173 — proxies /api → :8787
```

You'll need a `.dev.vars` file in each Worker directory with the same secrets you'd `wrangler secret put` in production. **Do not commit `.dev.vars`.** It's in `.gitignore`.

```bash
# workers/refresh/.dev.vars (example — never commit real keys)
STRIPE_KEY_BRUSSELS=rk_test_...    # use restricted test keys for local dev
ODOO_KEY_BELGIUM=...
VIVAWALLET_MERCHANT_ID=...
VIVAWALLET_KEY=...
SUPERMETRICS_API_KEY=...
GOOGLE_ADS_ACCOUNT_IDS=123-456-7890,...
META_ADS_ACCOUNT_IDS=act_123456,...
```

Run tests:

```bash
pnpm test                # all packages
pnpm --filter shared test
pnpm --filter refresh test
```

---

## Cloudflare deploy

### Prereqs

- Cloudflare account (free tier covers everything we need)
- A domain on Cloudflare (e.g. `dashboard.woodcutter.be`) for Cloudflare Access. **Access cannot gate `*.github.io` URLs** — that's why we need a Cloudflare-fronted domain.
- `wrangler` CLI: `pnpm i -g wrangler && wrangler login`

### 1 — Create the KV namespace

```bash
wrangler kv:namespace create woodcutter
# → Add to both workers/api/wrangler.toml AND workers/refresh/wrangler.toml
#   Replace REPLACE_WITH_KV_NAMESPACE_ID with the returned id.
```

### 2 — Set secrets on the refresh Worker

```bash
cd workers/refresh

# Stripe (9 venues — use Restricted Keys, see Security #1)
for v in BRUSSELS BERLIN FRANKFURT HAMBURG BONN KOLN LEIPZIG SHOOTERS_BRUSSELS; do
  wrangler secret put STRIPE_KEY_$v
done

# Odoo (6 venues)
for v in BELGIUM BERLIN FRANKFURT HAMBURG KOLN LEIPZIG; do
  wrangler secret put ODOO_KEY_$v
done

# Viva Wallet
wrangler secret put VIVAWALLET_MERCHANT_ID
wrangler secret put VIVAWALLET_KEY
# Optional: JSON-encoded SourceCode → "Belgium"|"Anvers" map
wrangler secret put VIVA_CITY_MAP

# Supermetrics
wrangler secret put SUPERMETRICS_API_KEY
wrangler secret put SUPERMETRICS_USER     # optional
wrangler secret put META_ADS_USER_ID      # optional

# Plain vars (declared in [vars] in wrangler.toml — set if they differ)
# GOOGLE_ADS_ACCOUNT_IDS  → comma-separated
# META_ADS_ACCOUNT_IDS    → comma-separated, "act_" prefix added if missing
```

### 3 — Set secrets on the api Worker

```bash
cd workers/api

# From the Cloudflare Zero Trust Access application:
wrangler secret put CF_ACCESS_AUD          # the AUD tag
wrangler secret put CF_ACCESS_TEAM_DOMAIN  # e.g. "woodcutter" (no .cloudflareaccess.com)
```

### 4 — Deploy

```bash
pnpm deploy:refresh
pnpm deploy:api
# Pages: connect the repo on the Cloudflare dashboard, set build cmd to
# `pnpm --filter web build`, output dir `apps/web/dist`. First push to main
# deploys.
```

### 5 — Configure Cloudflare Access

1. Cloudflare dashboard → Zero Trust → Settings → enable Google as identity provider.
2. Access → Applications → Add: **Self-hosted**.
   - Application domain: `dashboard.woodcutter.be` (and the api Worker route)
   - Identity provider: Google
   - Policy: Allow `email in {anthony.mady.work@gmail.com, romain2felix@gmail.com, julien.vandenitte.work@gmail.com}` (extend later)
3. Save the **AUD tag** — set it via `wrangler secret put CF_ACCESS_AUD` on the api Worker.
4. Optional: create an Access **group** `shooters-allowed` with the 3 Shooters Brussels emails. The Worker uses `SHOOTERS_ALLOWLIST` env var as the source of truth — keep both in sync.

### 6 — Verify

```bash
curl -H "Cf-Access-Jwt-Assertion: $JWT" https://your-api-worker.workers.dev/api/health
```

If healthy: dashboard is ready. If sources are stale (cold start, no cron run yet): manually trigger the refresh Worker via the Cloudflare dashboard's cron-triggers page → "Trigger now".

---

## Cutover checklist

Six-week dual-running rollout.

### Week 1-2 — build
- [ ] All Worker secrets set (`wrangler secret list`)
- [ ] Both Workers deployed + cron firing
- [ ] Pages preview accessible behind Access
- [ ] `/api/health` reports `ok` for all sources

### Week 3 — parity
- [ ] Run `scripts/parity/run.mjs` for one full week. Record diffs.
- [ ] Investigate any KPI deviation > 0.1% or row count > 0.5%.
- [ ] Confirm all `pi_` matches identical between old and new Belgium splits.

### Week 4 — soft cutover
- [ ] Point `dashboard.<domain>` at Cloudflare Pages
- [ ] Add a banner to the **old** GitHub Pages dashboard pointing to the new URL
- [ ] Notify the 3 active users

### Week 5 — observe
- [ ] Real users on the new system. Old system still runs for rollback safety.
- [ ] Monitor `/api/health` daily; investigate any `degraded` or `down`.

### Week 6 — decommission (in this order)

1. [ ] Disable Apps Script Mon 7am trigger (Apps Script editor → Triggers → delete).
2. [ ] Comment out `schedule:` blocks in `Poly-Exporter/.github/workflows/*.yml`.
3. [ ] Wait 7 days. Confirm nothing else relies on the Drive CSVs or the Sheet.
4. [ ] **Rotate every Stripe and Odoo key.** They've passed through SMTP envelopes, GitHub Actions logs, and a Drive-connected pipeline. Treat them as compromised. New keys go *only* to Worker secrets via `wrangler secret put`.
5. [ ] Archive `Poly-Exporter` and the legacy `woodcutter-dashboard` repos.
6. [ ] Delete Drive folder `1DCLUZyFw0xJ4KKTIi-AiIxXWBqZ0-bBw` (after exporting a final cold-storage snapshot for accounting records).
7. [ ] Mass-delete Gmail messages with subjects containing `Stripe Export`, `Odoo POS Export`, `Viva Export`. Empty Trash.
8. [ ] Revoke the legacy Google Cloud OAuth client (`1022326121984-...`).
9. [ ] Delete the `GOOGLE_SERVICE_ACCOUNT_JSON` service account from Google Cloud IAM. Revoke its key. Remove from Sheet sharing.

---

## Security obligations

These are real issues with the current system that **must be addressed during the migration**, not just at the end.

### 1. Stripe full-secret keys → Restricted Keys (do this first)

All 9 Stripe keys are currently full secret keys (`sk_live_…`) — anyone with the key can issue refunds, create charges, modify products. Switch to **Restricted Keys** with read-only permissions on:
- Charges
- PaymentIntents
- Refunds
- BalanceTransactions
- Terminal.Reader

Steps:
1. Stripe Dashboard → Developers → API keys → Create restricted key (per account).
2. Set the new key via `wrangler secret put STRIPE_KEY_<NAME>`.
3. After parity passes for a week, deactivate the old `sk_live_…` keys in Stripe.

### 2. Customer PII in Gmail/Drive

The legacy CSVs include `Email`, card-holder names, customer descriptions, and (for Viva) `Card Number`. They've been emailed weekly through `EMAIL_FROM`'s Gmail account, replicated to Drive, mirrored to whatever device has the Drive client.

**At cutover (week 6 above):**
- Mass-delete Gmail messages with the relevant subjects, including Trash.
- Delete the Drive folder after a cold-storage snapshot.
- **If `EMAIL_FROM` is a personal Gmail (not `operations@woodcutter.be`)**, this is a personal-data-processing problem under GDPR. Document the disposal.

### 3. Rotate every Stripe and Odoo key at cutover

Even after switching to Restricted Keys, rotate them. The keys themselves passed through SMTP envelopes (as Basic Auth headers), GitHub Actions logs, and a Drive-connected pipeline. Treat them as compromised.

### 4. Odoo persistent (no-expiry) API keys

Odoo lets you choose between expiring and non-expiring API keys; the original setup used non-expiring. Set a calendar reminder to rotate every 90 days. Better: switch to expiring keys after the cron architecture is stable.

### 5. Replace `anthony.mady.work@gmail.com` everywhere

This is a personal Gmail used as a business operations address. Personal accounts age out (job change, MFA reset, lockout). Replace with `dashboard@woodcutter.be` group alias post-cutover.

### 6. Worker secret leakage surfaces

- The refresh Worker scrubs known secret patterns (`sk_live_`, `Bearer …`, `?key=…`) before any `console.log`. Don't add ad-hoc logging that bypasses the scrubber.
- Vite source maps disabled in production builds (`vite.config.js` → `build.sourcemap: false`).
- `compatibility_date` and `compatibility_flags` set explicitly in `wrangler.toml` so future runtime changes don't surface unexpected behaviour in stack traces.

### 7. Service account JSON for Sheets becomes obsolete

After Supermetrics moves into the Worker, the `GOOGLE_SERVICE_ACCOUNT_JSON` is no longer needed. Delete the service account from Google Cloud IAM, revoke its key, remove it from the Sheet's sharing list. **A revoked-but-not-deleted service account is one IAM mistake away from being re-enabled.**

### 8. Public `woodcutter-dashboard` git history audit

Before archiving, run `gitleaks` against the legacy public dashboard repo. The hardcoded `CLIENT_ID` and `FOLDER_ID` are intelligence not secrets, but verify nothing was briefly committed and reverted (e.g., a service-account JSON or API key).

### 9. KV cache poisoning prevention

KV cache keys never include user-controlled input. The Worker enforces this at write time via `assertSafeKvKey()` — keys must match `^v\d+:(src|agg|meta):[a-zA-Z0-9_:\-\s]+$`. If a future change wants to allow user-supplied venue filters into a KV key, route them through a hard-coded enum first.

### 10. Cloudflare Access bypass — defense in depth

The api Worker validates the `Cf-Access-Jwt-Assertion` header itself (signature + `aud` + `exp`). **If Access is misconfigured at the edge ("Allow Everyone")**, the Worker still rejects unauthenticated requests. This is intentional — the JWT verification doesn't trust Access alone.

The Shooters Brussels venue gating is also enforced at the Worker (`venue=Shooters Brussels` returns 403 if the JWT email isn't in `SHOOTERS_ALLOWLIST`). The dashboard hides the venue from the UI, but a tampered client can't bypass.

---

## Operational notes

- **Cron schedule** (in `workers/refresh/wrangler.toml`):
  - `*/30 * * * *` — Stripe (every 30 min)
  - `7 * * * *`   — Odoo + Viva (every hour at :07)
  - `23 5 * * *`  — Supermetrics (daily 05:23 UTC ≈ 06:23–07:23 Brussels)
- **Failure mode**: per-venue failures don't kill the whole run. The Worker logs the error, leaves last-known-good in KV, and surfaces a stale-source banner in the dashboard footer.
- **Manual refresh**: trigger the cron Worker via the Cloudflare dashboard ("Trigger now" on the cron-triggers page).
- **Health check**: `GET /api/health` (unauthenticated, intentional — for synthetic monitors).
