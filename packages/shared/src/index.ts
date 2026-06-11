// Public API for @woodcutter/shared.
// Imported as `import { ... } from "@woodcutter/shared"` from both Worker and dashboard.

export * from "./venues.ts";
export * from "./targets.ts";
export * from "./vat.ts";
export * from "./iso.ts";
export * from "./split.ts";
export * from "./types.ts";
export * as schemas from "./schemas.ts";

/** Bump this when the api response shape changes in a breaking way. */
export const SCHEMA_VERSION = 1 as const;

/** KV key namespace constant — bump to invalidate the entire cache. */
export const KV_VERSION = "v1" as const;

export const KV_KEYS = {
  /** Aggregated revenue payload. */
  revenue: (venue: string, year: number) => `${KV_VERSION}:agg:revenue:${venue}:${year}`,
  /** Aggregated marketing payload. */
  marketing: (venue: string, year: number) => `${KV_VERSION}:agg:marketing:${venue}:${year}`,
  /** Aggregated weekly digest payload. */
  digest: (year: number) => `${KV_VERSION}:agg:digest:${year}`,
  /** Per-source raw slices. */
  stripeSlice: (venue: string, year: number) => `${KV_VERSION}:src:stripe:${venue}:${year}`,
  odooPosSlice: (venue: string, year: number) => `${KV_VERSION}:src:odoo_pos:${venue}:${year}`,
  odooInvoicesSlice: (venue: string, year: number) => `${KV_VERSION}:src:odoo_invoices:${venue}:${year}`,
  vivaSlice: (year: number) => `${KV_VERSION}:src:viva:Belgium:${year}`,
  supermetricsGoogleSlice: (year: number) => `${KV_VERSION}:src:supermetrics_google:all:${year}`,
  supermetricsMetaSlice: (year: number) => `${KV_VERSION}:src:supermetrics_meta:all:${year}`,
  /** Per-source freshness audit (latest ok/error timestamps). */
  freshness: () => `${KV_VERSION}:meta:freshness`,
} as const;

/**
 * Validate a KV key matches the safe pattern. Used as an assertion at write
 * time so user-controlled values never leak into cache keys (poisoning).
 */
export function assertSafeKvKey(key: string): void {
  if (!/^v\d+:(src|agg|meta):[a-zA-Z0-9_:\-\s]+$/.test(key)) {
    throw new Error(`unsafe KV key: ${key}`);
  }
}
