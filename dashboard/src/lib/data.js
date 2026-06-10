/**
 * Data transformation helpers for Google Ads rows.
 * All monetary values are in the account currency (EUR based on campaign names).
 */

export const VENUES = [
  "All venues",
  "Brussels",
  "Antwerp",
  "Berlin",
  "Frankfurt",
  "Hamburg",
  "Cologne",
  "Leipzig",
  "Shooters Brussels",
];

const VENUE_PATTERNS = [
  // Shooters Brussels brand — all shooting bar / generic shooting campaigns
  { pattern: /shooters|shooting.?bar|schietbar|exp.?rience.?tir|^brand_|^generic_/i, venue: "Shooters Brussels" },
  // Venue-specific campaigns
  { pattern: /bruxelles|BEL.*french|french.*BEL/i, venue: "Brussels" },
  { pattern: /BEL.*dutch|dutch.*BEL/i,             venue: "Antwerp" },
  { pattern: /berlin/i,                             venue: "Berlin" },
  { pattern: /frankfurt/i,                          venue: "Frankfurt" },
  { pattern: /hamburg/i,                            venue: "Hamburg" },
  { pattern: /cologne/i,                            venue: "Cologne" },
  { pattern: /leipzig/i,                            venue: "Leipzig" },
];

export function parseVenue(name = "") {
  for (const { pattern, venue } of VENUE_PATTERNS) {
    if (pattern.test(name)) return venue;
  }
  return null; // country-wide brand campaigns — shown only under "All venues"
}

/** Returns spend of rows that have no venue (country-wide brand campaigns). */
export function getBrandOnlySpend(rows) {
  return rows
    .filter((r) => parseVenue(r.CampaignName) === null)
    .reduce((a, r) => a + num(r.Cost), 0);
}

/** Returns only WoodCutter brand/generic rows (no specific venue, excludes Shooters). */
export function filterBrandCampaigns(rows) {
  return rows.filter((r) => parseVenue(r.CampaignName) === null);
}

const COUNTRY_PATTERNS = [
  { pattern: /\bFR\b/,  label: "France" },
  { pattern: /\bNL\b/,  label: "Netherlands" },
  { pattern: /\bBEL?\b/,label: "Belgium" },
  { pattern: /\bGER\b/, label: "Germany" },
];

const TYPE_PATTERNS = [
  { pattern: /^PMAX/i,   label: "Performance Max" },
  { pattern: /^Brand/i,  label: "Brand" },
  { pattern: /^Generic/i,label: "Generic" },
  { pattern: /^Search/i, label: "Search" },
];

export function parseCountry(name = "") {
  for (const { pattern, label } of COUNTRY_PATTERNS) {
    if (pattern.test(name)) return label;
  }
  return "Other";
}

export function parseCampaignType(name = "") {
  for (const { pattern, label } of TYPE_PATTERNS) {
    if (pattern.test(name)) return label;
  }
  return "Other";
}

export function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

/** Filter rows by venue. "All venues" returns everything. */
export function filterByVenue(rows, venue) {
  if (!venue || venue === "All venues") return rows;
  return rows.filter((r) => parseVenue(r.CampaignName) === venue);
}

/** Filter rows by a date range. start/end are "YYYY-MM-DD" strings or null. */
export function filterByDate(rows, start, end) {
  return rows.filter((r) => {
    const d = r.Date;
    if (!d) return false;
    if (start && d < start) return false;
    if (end   && d > end)   return false;
    return true;
  });
}

/** Aggregate rows by date → { date, spend, clicks, impressions, conversions, convValue } */
export function aggregateByDate(rows) {
  const map = {};
  for (const r of rows) {
    const d = r.Date;
    if (!d) continue;
    if (!map[d]) map[d] = { date: d, spend: 0, clicks: 0, impressions: 0, conversions: 0, convValue: 0 };
    map[d].spend       += num(r.Cost);
    map[d].clicks      += num(r.Clicks);
    map[d].impressions += num(r.Impressions);
    map[d].conversions += num(r.Conversions);
    map[d].convValue   += num(r.ConversionValue);
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

/** Aggregate rows by campaign name */
export function aggregateByCampaign(rows) {
  const map = {};
  for (const r of rows) {
    const name = r.CampaignName || "Unknown";
    if (!map[name]) map[name] = {
      campaign: name,
      country: parseCountry(name),
      type: parseCampaignType(name),
      venue: parseVenue(name) ?? "Brand/Generic",
      spend: 0, clicks: 0, impressions: 0, conversions: 0, convValue: 0,
    };
    map[name].spend       += num(r.Cost);
    map[name].clicks      += num(r.Clicks);
    map[name].impressions += num(r.Impressions);
    map[name].conversions += num(r.Conversions);
    map[name].convValue   += num(r.ConversionValue);
  }
  return Object.values(map).map((c) => ({
    ...c,
    roas: c.spend > 0 ? c.convValue / c.spend : 0,
    cpc:  c.clicks > 0 ? c.spend / c.clicks : 0,
    ctr:  c.impressions > 0 ? c.clicks / c.impressions : 0,
  })).sort((a, b) => b.spend - a.spend);
}

/** Aggregate rows by country */
export function aggregateByCountry(rows) {
  const map = {};
  for (const r of rows) {
    const country = parseCountry(r.CampaignName);
    if (!map[country]) map[country] = { country, spend: 0, conversions: 0, convValue: 0, clicks: 0 };
    map[country].spend       += num(r.Cost);
    map[country].conversions += num(r.Conversions);
    map[country].convValue   += num(r.ConversionValue);
    map[country].clicks      += num(r.Clicks);
  }
  return Object.values(map)
    .map((c) => ({ ...c, roas: c.spend > 0 ? c.convValue / c.spend : 0 }))
    .sort((a, b) => b.spend - a.spend);
}

/** Top-level KPIs */
export function computeKpis(rows) {
  const spend       = rows.reduce((a, r) => a + num(r.Cost), 0);
  const clicks      = rows.reduce((a, r) => a + num(r.Clicks), 0);
  const impressions = rows.reduce((a, r) => a + num(r.Impressions), 0);
  const conversions = rows.reduce((a, r) => a + num(r.Conversions), 0);
  const convValue   = rows.reduce((a, r) => a + num(r.ConversionValue), 0);
  return {
    spend,
    clicks,
    impressions,
    conversions,
    convValue,
    roas: spend > 0 ? convValue / spend : 0,
    ctr:  impressions > 0 ? clicks / impressions : 0,
    cpc:  clicks > 0 ? spend / clicks : 0,
    cpa:  conversions > 0 ? spend / conversions : 0,
  };
}

/** Get the date range preset boundaries */
export function getDateRange(preset, allRows, customRange = null) {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);

  if (preset === "7d")     return { start: fmt(new Date(today - 7  * 864e5)), end: fmt(today) };
  if (preset === "30d")    return { start: fmt(new Date(today - 30 * 864e5)), end: fmt(today) };
  if (preset === "90d")    return { start: fmt(new Date(today - 90 * 864e5)), end: fmt(today) };
  if (preset === "ytd")    return { start: `${today.getFullYear()}-01-01`,    end: fmt(today) };
  if (preset === "custom") return customRange ?? { start: null, end: null };
  if (preset === "all") {
    const dates = allRows.map((r) => r.Date).filter(Boolean).sort();
    return { start: dates[0] ?? fmt(today), end: dates[dates.length - 1] ?? fmt(today) };
  }
  return { start: null, end: null };
}
