import Stripe from "stripe";
import type { StripeRow, Venue } from "@woodcutter/shared";
import { ALL_VENUES } from "@woodcutter/shared";

// Ports stripe_export.py. Reader Label is ground truth for in-store; the
// Stripe Node SDK works in Workers via the fetch-based HTTP client.
//
// Date range = YTD (Jan 1 → now), paginated. The SDK's auto-pagination is used
// the same way the Python script uses `auto_paging_iter()`.

const TERMINAL_TYPES = new Set(["card_present", "interac_present"]);

export interface StripeFetchEnv {
  // Each venue's secret key — `wrangler secret put STRIPE_KEY_<NAME_UPPER_UNDERSCORED>`.
  // The mapping is: venue name → SCREAMING_SNAKE_CASE.
  [key: string]: string;
}

/** Map a Venue to its env var name. Mirrors LOCATIONS in stripe_export.py. */
export function stripeKeyEnvName(venue: Venue): string {
  // "Shooters Brussels" → "STRIPE_KEY_SHOOTERS_BRUSSELS"
  // "Belgium"           → "STRIPE_KEY_BRUSSELS"  (legacy mapping — Belgium stripe key is named BRUSSELS)
  if (venue === "Belgium") return "STRIPE_KEY_BRUSSELS";
  return `STRIPE_KEY_${venue.toUpperCase().replace(/\s+/g, "_")}`;
}

export interface StripeFetchOptions {
  apiKey: string;
  venue: Venue;
  /** Unix seconds. */
  since: number;
  /** Unix seconds. */
  until: number;
}

export async function fetchStripeForVenue(opts: StripeFetchOptions): Promise<StripeRow[]> {
  const stripe = new Stripe(opts.apiKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Build reader_id → label map. Used to derive in-store ground truth.
  const readerMap = new Map<string, string>();
  try {
    for await (const reader of stripe.terminal.readers.list({ limit: 100 })) {
      readerMap.set(reader.id, reader.label || "");
    }
  } catch {
    // Some accounts (online-only) have no Terminal access — fine.
  }

  const rows: StripeRow[] = [];

  for await (const charge of stripe.charges.list({
    created: { gte: opts.since, lte: opts.until },
    limit: 100,
    expand: ["data.payment_intent", "data.refunds", "data.balance_transaction"],
  })) {
    rows.push(rowFromCharge(charge, readerMap, opts.venue));
  }

  return rows;
}

function rowFromCharge(
  charge: Stripe.Charge,
  readerMap: ReadonlyMap<string, string>,
  venue: Venue,
): StripeRow {
  // ── Status ────────────────────────────────────────────────────────────
  let status: StripeRow["status"];
  if (charge.refunded) status = "Refunded";
  else if (charge.status === "succeeded") status = "Paid";
  else if (charge.status === "failed") status = "Failed";
  else status = charge.status;

  // ── Payment method type ───────────────────────────────────────────────
  const pmdType = charge.payment_method_details?.type ?? "";

  // ── Reader label (terminal ground truth) ──────────────────────────────
  let readerLabel = "";
  const cardPresent = charge.payment_method_details?.card_present as
    | (Stripe.Charge.PaymentMethodDetails.CardPresent & { reader?: string | null })
    | undefined;
  if (cardPresent?.reader && typeof cardPresent.reader === "string") {
    readerLabel = readerMap.get(cardPresent.reader) ?? "";
  }

  // ── In-store: terminal reader recorded OR card_present-family type ────
  const paymentType: StripeRow["paymentType"] =
    readerLabel || TERMINAL_TYPES.has(pmdType) ? "in-store" : "online";

  // ── PaymentIntent + tip extraction ────────────────────────────────────
  let tipAmount = 0;
  let paymentIntentId: string | null = null;
  const pi = charge.payment_intent;
  if (pi && typeof pi !== "string") {
    paymentIntentId = pi.id;
    const tip = pi.amount_details?.tip;
    if (tip && typeof tip.amount === "number") {
      tipAmount = tip.amount / 100;
    }
  } else if (typeof pi === "string") {
    paymentIntentId = pi;
  }

  // ── Balance transaction (fees + net) ──────────────────────────────────
  let stripeFee = 0;
  let netAmount = 0;
  const bt = charge.balance_transaction;
  if (bt && typeof bt !== "string") {
    stripeFee = bt.fee / 100;
    netAmount = bt.net / 100;
  }

  return {
    id: charge.id,
    venue,
    // City is filled in later by the aggregator (Belgium → Brussels/Anvers split).
    // Default for non-Belgium: city == venue.
    city: venue === "Belgium" ? "Belgium" : venue,
    createdAt: new Date(charge.created * 1000).toISOString(),
    amount: charge.amount / 100,
    amountRefunded: charge.amount_refunded / 100,
    currency: (charge.currency || "").toUpperCase(),
    status,
    paymentType,
    readerLabel,
    paymentMethodType: pmdType,
    tipAmount,
    paymentIntentId,
    stripeFee,
    netAmount,
    description: charge.description ?? "",
  };
}

export interface StripeFanoutResult {
  rowsByVenue: Map<Venue, StripeRow[]>;
  errors: Array<{ venue: Venue; error: string }>;
}

/**
 * Fan out across all venues in parallel. Per-venue failures don't kill the run —
 * they get reported in `errors` and the aggregator falls back to last-known-good.
 */
export async function fetchAllStripe(
  env: StripeFetchEnv,
  since: number,
  until: number,
): Promise<StripeFanoutResult> {
  const tasks = ALL_VENUES.filter((v) => v !== "Anvers").map(async (venue) => {
    // Anvers data lives in the Belgium account — no separate Anvers Stripe key.
    const keyName = stripeKeyEnvName(venue);
    const apiKey = env[keyName];
    if (!apiKey) return { venue, error: `missing secret: ${keyName}`, rows: null };
    try {
      const rows = await fetchStripeForVenue({ apiKey, venue, since, until });
      return { venue, rows, error: null };
    } catch (err) {
      // Strip key-shaped substrings from error messages before surfacing.
      const msg = scrubSecrets(String(err), [apiKey]);
      return { venue, error: msg, rows: null };
    }
  });

  const settled = await Promise.allSettled(tasks);
  const rowsByVenue = new Map<Venue, StripeRow[]>();
  const errors: Array<{ venue: Venue; error: string }> = [];

  for (const r of settled) {
    if (r.status === "rejected") {
      // Should never hit — inner catch normalises. Belt + braces.
      errors.push({ venue: "Belgium", error: String(r.reason) });
      continue;
    }
    const { venue, rows, error } = r.value;
    if (rows) rowsByVenue.set(venue, rows);
    if (error) errors.push({ venue, error });
  }
  return { rowsByVenue, errors };
}

/** Strip exact-match key substrings from any string (defense against accidental log leakage). */
function scrubSecrets(s: string, secrets: string[]): string {
  let out = s;
  for (const secret of secrets) {
    if (!secret) continue;
    out = out.split(secret).join("[REDACTED]");
  }
  return out;
}
