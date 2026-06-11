# Parity Script

Compares old CSV exports (downloaded from Drive) to the new Worker's `/api/revenue` output.
Run before cutover to confirm the new system produces the same numbers as the old.

## Acceptance criteria

- KPIs (totalRevenue, totalTips) within **0.1%**
- Row count within **0.5%**
- All `pi_` matches identical between old and new Belgium splits

## How to run

1. Download the old CSVs from Drive (folder `1DCLUZyFw0xJ4KKTIi-AiIxXWBqZ0-bBw`) into a local folder.

2. Get a Cloudflare Access JWT for the new system:
   - Open the dashboard once in your browser; you'll be sent through Google SSO.
   - Open DevTools → Application → Cookies → copy the `CF_Authorization` cookie value (this is the JWT).

3. Run:

```bash
node scripts/parity/run.mjs \
  --csv-dir ./old-csvs \
  --api https://woodcutter-api.YOUR-SUBDOMAIN.workers.dev/api \
  --jwt "$CF_AUTH"
```

## Common failure modes

- **`no old CSV found`** — the folder doesn't contain a file matching the venue name. Old CSVs are named `stripe_2026_Belgium_YTD.csv` — check the casing.
- **revenue Δ 0.5%** — usually a Belgium/Anvers split timing issue. The old dashboard rebuilds the split on every page load; the new Worker rebuilds on every cron. Wait for the next cron cycle and re-check.
- **rows Δ > 1%** — Stripe pagination ordering may differ. Confirm the old CSV's `id` column intersection with the new `rows`.

## Re-arming after a fix

Just re-run — the Worker is idempotent and the CSV files don't change.
