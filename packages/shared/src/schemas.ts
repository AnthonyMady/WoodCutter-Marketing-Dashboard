import { z } from "zod";

// Runtime schemas — used by the Worker to validate KV payloads on read,
// and by the dashboard to validate API responses on fetch. If the shape ever
// drifts, parse() throws and the caller surfaces a clear error.
//
// Keep these in lockstep with types.ts.

export const SourceIdSchema = z.enum([
  "stripe",
  "odoo_pos",
  "odoo_invoices",
  "viva",
  "supermetrics_google",
  "supermetrics_meta",
]);

export const VenueSchema = z.enum([
  "Belgium",
  "Anvers",
  "Berlin",
  "Frankfurt",
  "Hamburg",
  "Bonn",
  "Koln",
  "Leipzig",
  "Shooters Brussels",
]);

export const SourceFreshnessSchema = z.object({
  okAt: z.string().nullable(),
  errorAt: z.string().nullable(),
  error: z.string().optional(),
});

export const PartialReasonSchema = z.object({
  source: SourceIdSchema,
  venue: VenueSchema.optional(),
  reason: z.string(),
});

export const MetaSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  sourceFreshness: z.record(SourceIdSchema, SourceFreshnessSchema).default({}),
  venueFilter: z.union([VenueSchema, z.literal("All")]),
  dateRange: z.object({ from: z.string(), to: z.string() }),
});
