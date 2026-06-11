import { useState, useMemo } from "react";
import {
  filterByDate, filterByVenues, excludeShooters,
  aggregateByDate, aggregateByCampaign, computeKpis,
  parseVenue, normaliseMetaRow, normaliseGoogleRow, num,
} from "../lib/data.js";

const money  = (n) => `€${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pct    = (n) => `${(n * 100).toFixed(2)}%`;
const fmt    = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

const VENUES = ["Brussels", "Antwerp", "Berlin", "Frankfurt", "Hamburg", "Cologne", "Leipzig"];

const G_BLUE  = "#185FA5";
const M_BLUE  = "#85B7EB";
const G_LIGHT = "#E6F1FB";

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid #e5e7eb",
      borderRadius: 12, padding: "16px 18px", ...style,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, sub2 }) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 500, color: "#111827", lineHeight: 1.15 }}>{value}</p>
      {sub  && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>{sub}</p>}
      {sub2 && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{sub2}</p>}
    </Card>
  );
}

function SpendChart({ byDate }) {
  if (!byDate.length) return null;
  const maxSpend = Math.max(...byDate.map(d => d.gSpend + d.mSpend), 1);
  const maxH = 72;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: maxH }}>
      {byDate.map((d) => {
        const gH = Math.round((d.gSpend / maxSpend) * maxH);
        const mH = Math.round((d.mSpend / maxSpend) * maxH);
        return (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1, height: "100%", justifyContent: "flex-end" }} title={`${d.date}\nGoogle €${d.gSpend.toFixed(0)}\nMeta €${d.mSpend.toFixed(0)}`}>
            {gH > 0 && <div style={{ background: G_BLUE, height: gH, borderRadius: "1px 1px 0 0", opacity: 0.9 }} />}
            {mH > 0 && <div style={{ background: M_BLUE, height: mH }} />}
          </div>
        );
      })}
    </div>
  );
}

function VenueBar({ venue, spend, maxSpend }) {
  const w = maxSpend > 0 ? Math.round((spend / maxSpend) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
      <span style={{ width: 72, textAlign: "right", color: "#6b7280", flexShrink: 0 }}>{venue}</span>
      <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 2, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: G_BLUE, borderRadius: 2 }} />
      </div>
      <span style={{ width: 40, color: "#374151", fontWeight: 500 }}>{money(spend)}</span>
    </div>
  );
}

export default function PerformanceTab({ data, start, end }) {
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [showGoogle, setShowGoogle] = useState(true);
  const [showMeta,   setShowMeta]   = useState(true);

  const toggleVenue = (v) =>
    setSelectedVenues(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const allSelected = selectedVenues.length === 0;

  const gAll = useMemo(() => excludeShooters(filterByDate((data.googleAds ?? []).map(normaliseGoogleRow), start, end)), [data.googleAds, start, end]);
  const mAll = useMemo(() => excludeShooters(filterByDate((data.metaAds   ?? []).map(normaliseMetaRow),   start, end)), [data.metaAds,   start, end]);

  const gRows = useMemo(() => filterByVenues(gAll, selectedVenues), [gAll, selectedVenues]);
  const mRows = useMemo(() => filterByVenues(mAll, selectedVenues), [mAll, selectedVenues]);

  const gActive = showGoogle ? gRows : [];
  const mActive = showMeta   ? mRows : [];

  const gKpis = useMemo(() => computeKpis(gActive), [gActive]);
  const mKpis = useMemo(() => computeKpis(mActive), [mActive]);
  const totalSpend = gKpis.spend + mKpis.spend;
  const totalClicks = gKpis.clicks + mKpis.clicks;
  const totalImpressions = gKpis.impressions + mKpis.impressions;
  const combinedCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  const byDate = useMemo(() => {
    const map = {};
    for (const r of gActive) {
      const d = r.Date; if (!d) continue;
      if (!map[d]) map[d] = { date: d, gSpend: 0, mSpend: 0 };
      map[d].gSpend += num(r.Cost);
    }
    for (const r of mActive) {
      const d = r.Date; if (!d) continue;
      if (!map[d]) map[d] = { date: d, gSpend: 0, mSpend: 0 };
      map[d].mSpend += num(r.Cost);
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [gActive, mActive]);

  const allActiveRows = [...gActive, ...mActive];
  const topCampaigns = useMemo(() => aggregateByCampaign(allActiveRows).slice(0, 6), [allActiveRows]);

  const venueSpend = useMemo(() => {
    const map = {};
    for (const r of [...gActive, ...mActive]) {
      const v = parseVenue(r.CampaignName);
      if (!v || v === "Shooters Brussels") continue;
      map[v] = (map[v] ?? 0) + num(r.Cost);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [gActive, mActive]);
  const maxVenueSpend = venueSpend[0]?.[1] ?? 1;

  const SourcePill = ({ label, active, color, onClick }) => (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
      borderRadius: 20, border: `0.5px solid ${active ? color : "#e5e7eb"}`,
      background: active ? G_LIGHT : "#fff",
      color: active ? color : "#9ca3af",
      fontSize: 12, fontWeight: 500, cursor: "pointer",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? color : "#d1d5db", display: "inline-block" }} />
      {label}
    </button>
  );

  const VenuePill = ({ label, active }) => (
    <button onClick={() => allSelected && label !== "All" ? toggleVenue(label) : label === "All" ? setSelectedVenues([]) : toggleVenue(label)} style={{
      padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: active ? 500 : 400,
      border: `0.5px solid ${active ? G_BLUE : "#e5e7eb"}`,
      background: active ? G_LIGHT : "#fff",
      color: active ? G_BLUE : "#6b7280",
      cursor: "pointer",
    }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* Filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <VenuePill label="All venues" active={allSelected} />
        {VENUES.map(v => <VenuePill key={v} label={v} active={selectedVenues.includes(v)} />)}
        <div style={{ flex: 1 }} />
        <SourcePill label="Google Ads" active={showGoogle} color={G_BLUE}  onClick={() => setShowGoogle(v => !v)} />
        <SourcePill label="Meta Ads"   active={showMeta}   color="#378ADD" onClick={() => setShowMeta(v => !v)} />
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KpiCard
          label="Total spend"
          value={money(totalSpend)}
          sub={showGoogle && showMeta ? `Google ${money(gKpis.spend)}` : undefined}
          sub2={showGoogle && showMeta ? `Meta ${money(mKpis.spend)}` : undefined}
        />
        <KpiCard
          label="Clicks"
          value={fmt(totalClicks)}
          sub={`${pct(combinedCtr)} CTR`}
        />
        {showGoogle && (
          <KpiCard
            label="Conversions"
            value={fmt(gKpis.conversions)}
            sub={gKpis.conversions > 0 ? `€${gKpis.cpa.toFixed(2)} CPA` : "Google only"}
          />
        )}
        {showGoogle && (
          <KpiCard
            label="Google ROAS"
            value={`${gKpis.roas.toFixed(2)}x`}
            sub={`€${gKpis.cpc.toFixed(2)} CPC`}
          />
        )}
      </div>

      {/* Spend chart */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>Daily spend</p>
          <div style={{ display: "flex", gap: 12 }}>
            {showGoogle && <span style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: G_BLUE, display: "inline-block" }} />Google</span>}
            {showMeta   && <span style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: M_BLUE, display: "inline-block" }} />Meta</span>}
          </div>
        </div>
        <SpendChart byDate={byDate} />
        {byDate.length === 0 && <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No data for this range</p>}
      </Card>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 14 }}>Spend by venue</p>
          {venueSpend.length === 0
            ? <p style={{ fontSize: 13, color: "#9ca3af" }}>No venue data</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {venueSpend.map(([v, s]) => <VenueBar key={v} venue={v} spend={s} maxSpend={maxVenueSpend} />)}
              </div>
          }
        </Card>

        <Card>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 14 }}>Top campaigns · spend</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {topCampaigns.length === 0
              ? <p style={{ fontSize: 13, color: "#9ca3af" }}>No data</p>
              : topCampaigns.map(c => (
                <div key={c.campaign} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c._source === "meta" ? M_BLUE : G_BLUE, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", flexShrink: 0 }}>{money(c.spend)}</span>
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
