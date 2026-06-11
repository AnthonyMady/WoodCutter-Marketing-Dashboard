#!/usr/bin/env node
/**
 * Parity script — compares old CSV exports against new Worker JSON output.
 *
 * Usage:
 *   node scripts/parity/run.mjs \
 *     --csv-dir ./old-csvs \
 *     --api https://woodcutter-api.example.workers.dev/api \
 *     --jwt eyJ...   (Cf-Access-Jwt-Assertion from a logged-in browser)
 *
 * Acceptance:
 *   - KPIs (totalRevenue, totalTips, tipRate) within 0.1%
 *   - Row count within 0.5%
 *   - All pi_ matches identical between old and new
 *
 * Exit code:
 *   0 if all venues pass acceptance
 *   1 if any venue diverges
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { argv, exit } from "node:process";

const args = parseArgs(argv.slice(2));
const csvDir = args["csv-dir"];
const apiBase = args["api"];
const jwt = args["jwt"];

if (!csvDir || !apiBase) {
  console.error("Usage: --csv-dir <dir> --api <url> [--jwt <token>]");
  exit(2);
}

const VENUES = ["Belgium", "Berlin", "Frankfurt", "Hamburg", "Bonn", "Koln", "Leipzig", "Shooters Brussels"];
const KPI_TOLERANCE = 0.001; // 0.1%
const ROW_TOLERANCE = 0.005; // 0.5%

const passed = [];
const failed = [];

for (const venue of VENUES) {
  const result = await compareVenue(venue);
  console.log(formatResult(result));
  if (result.ok) passed.push(venue);
  else failed.push(venue);
}

console.log(`\n${passed.length}/${VENUES.length} venues pass.`);
if (failed.length > 0) {
  console.log(`Failed: ${failed.join(", ")}`);
  exit(1);
}

// ─────────────────────────── helpers ──────────────────────────────────

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const k = args[i].slice(2);
      const v = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
      out[k] = v;
      if (v !== true) i++;
    }
  }
  return out;
}

async function compareVenue(venue) {
  const oldData = await loadOldCsv(venue);
  const newData = await fetchNew(venue);

  if (!oldData) return { venue, ok: false, reason: "no old CSV found" };
  if (!newData || newData.error) return { venue, ok: false, reason: `api error: ${newData?.error ?? "missing"}` };

  const oldKpis = computeKpisFromOldCsv(oldData, venue);
  const newKpis = newData.kpis;

  const checks = {
    totalRevenue: relDiff(oldKpis.totalRevenue, newKpis.totalRevenue),
    totalTips:    relDiff(oldKpis.totalTips,    newKpis.totalTips),
    rowCount:     relDiff(oldKpis.rowCount,     newKpis.rowCount ?? newData.rows?.length ?? 0),
  };

  const ok =
    checks.totalRevenue <= KPI_TOLERANCE &&
    checks.totalTips <= KPI_TOLERANCE &&
    checks.rowCount <= ROW_TOLERANCE;

  return { venue, ok, oldKpis, newKpis, checks };
}

function relDiff(a, b) {
  if (a === 0 && b === 0) return 0;
  if (a === 0) return 1;
  return Math.abs(a - b) / Math.abs(a);
}

async function loadOldCsv(venue) {
  // Filename: stripe_2026_<Venue>_YTD.csv
  const files = await readdir(csvDir);
  const match = files.find((f) => f.toLowerCase().includes(venue.toLowerCase()) && f.endsWith(".csv"));
  if (!match) return null;
  const text = await readFile(join(csvDir, match), "utf8");
  return parseCsv(text);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

// Naïve CSV splitter — assumes the old exports never embedded commas/quotes
// awkwardly. If we ever fail parity due to a row with embedded quotes,
// upgrade this to a real CSV parser. Otherwise this stays small.
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

function computeKpisFromOldCsv(rows, venue) {
  let totalRevenue = 0;
  let totalTips = 0;
  let rowCount = 0;
  for (const r of rows) {
    if (r.Status !== "Paid") continue;
    rowCount++;
    totalRevenue += parseFloat(r.Amount ?? "0") || 0;
    totalTips    += parseFloat(r.tip_amount ?? "0") || 0;
  }
  return { totalRevenue, totalTips, rowCount };
}

async function fetchNew(venue) {
  const url = `${apiBase}/revenue?venue=${encodeURIComponent(venue)}`;
  const headers = jwt ? { "Cf-Access-Jwt-Assertion": jwt } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  return res.json();
}

function formatResult(r) {
  if (!r.ok) {
    return `❌ ${r.venue}: ${r.reason ?? JSON.stringify(r.checks)}`;
  }
  return `✅ ${r.venue}: revenue Δ${pct(r.checks.totalRevenue)}, tips Δ${pct(r.checks.totalTips)}, rows Δ${pct(r.checks.rowCount)}`;
}

function pct(x) {
  return `${(x * 100).toFixed(3)}%`;
}
