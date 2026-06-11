import { useState } from "react";
import {
  filterByDate, filterByVenues, excludeShooters,
  aggregateByDate, aggregateByCampaign, computeKpis,
  parseVenue, normaliseMetaRow, normaliseGoogleRow, num,
} from "../lib/data.js";
import KpiCard           from "./KpiCard.jsx";
import SpendChart        from "./SpendChart.jsx";
import TopCampaignsChart from "./TopCampaignsChart.jsx";
import CampaignTable     from "./CampaignTable.jsx";

const money = (n) => `€${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const ALL_VENUES = ["Brussels", "Antwerp", "Berlin", "Frankfurt", "Hamburg", "Cologne", "Leipzig", "Brand/Generic"];

const FLAG = {
  "Brussels": "🇧🇪", "Antwerp": "🇧🇪",
  "Berlin": "🇩🇪", "Frankfurt": "🇩🇪", "Hamburg": "🇩🇪", "Cologne": "🇩🇪", "Leipzig": "🇩🇪",
  "Brand/Generic": "🌍",
};

function Checkbox({ label, checked, onChange, color }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, color: checked ? color : "#6b7280", userSelect: "none" }}>
      <div onClick={onChange} style={{
        width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? color : "#d1d5db"}`,
        background: checked ? color : "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s", flexShrink: 0,
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
      </div>
      {label}
    </label>
  );
}

export default function PerformanceTab({ data, start, end, canSeeShooters }) {
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [showGoogle, setShowGoogle]         = useState(true);
  const [showMeta, setShowMeta]             = useState(true);

  const toggleVenue = (v) => {
    setSelectedVenues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  // Normalise rows and tag source
  const googleRows = (data.googleAds ?? []).map(normaliseGoogleRow);
  const metaRows   = (data.metaAds   ?? []).map(normaliseMetaRow);

  // Date filter
  const gFiltered = filterByDate(excludeShooters(googleRows), start, end);
  const mFiltered = filterByDate(excludeShooters(metaRows),   start, end);

  // Venue filter (empty = all)
  const gVenue = filterByVenues(gFiltered, selectedVenues);
  const mVenue = filterByVenues(mFiltered, selectedVenues);

  // Source selection
  const activeRows = [
    ...(showGoogle ? gVenue : []),
    ...(showMeta   ? mVenue : []),
  ];

  const gKpis      = computeKpis(showGoogle ? gVenue : []);
  const mKpis      = computeKpis(showMeta   ? mVenue : []);
  const combined   = computeKpis(activeRows);
  const byDate     = aggregateByDate(activeRows);
  const campaigns  = aggregateByCampaign(activeRows);

  const venueLabel = selectedVenues.length === 0
    ? "All venues"
    : selectedVenues.join(", ");

  return (
    <div>
      {/* Filters row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Source filter */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Data source
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Checkbox label="Google Ads" checked={showGoogle} onChange={() => setShowGoogle(v => !v)} color="#2563eb" />
            <Checkbox label="Meta Ads"   checked={showMeta}   onChange={() => setShowMeta(v => !v)}   color="#0866ff" />
          </div>
        </div>

        {/* Venue filter */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Venues {selectedVenues.length > 0 && <span style={{ color: "#2563eb" }}>({selectedVenues.length} selected)</span>}
            </p>
            {selectedVenues.length > 0 && (
              <button onClick={() => setSelectedVenues([])} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_VENUES.map((v) => {
              const checked = selectedVenues.includes(v);
              return (
                <button key={v} onClick={() => toggleVenue(v)} style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: checked ? 600 : 500,
                  border: `1px solid ${checked ? "#2563eb" : "#e5e7eb"}`,
                  background: checked ? "#eff6ff" : "#fff",
                  color: checked ? "#2563eb" : "#6b7280",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span>{FLAG[v] ?? "📍"}</span>{v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Combined KPIs */}
      {showGoogle && showMeta && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Combined</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <KpiCard label="Total Spend"  value={money(combined.spend)} sub={venueLabel} />
            <KpiCard label="Clicks"       value={combined.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(combined.ctr * 100).toFixed(2)}% CTR`} />
            <KpiCard label="Impressions"  value={combined.impressions.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
          </div>
        </div>
      )}

      {/* Google Ads KPIs */}
      {showGoogle && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb" }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.08em" }}>Google Ads</p>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <KpiCard label="Spend"        value={money(gKpis.spend)} />
            <KpiCard label="Conversions"  value={gKpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${gKpis.cpa.toFixed(2)} CPA`} />
            <KpiCard label="Conv. Value"  value={money(gKpis.convValue)} sub="revenue attributed" />
            <KpiCard label="ROAS"         value={gKpis.roas.toFixed(2) + "x"} sub={`€${gKpis.cpc.toFixed(2)} CPC`} />
          </div>
        </div>
      )}

      {/* Meta Ads KPIs */}
      {showMeta && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0866ff" }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: "#0866ff", textTransform: "uppercase", letterSpacing: "0.08em" }}>Meta Ads</p>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <KpiCard label="Spend"        value={money(mKpis.spend)} />
            <KpiCard label="Actions"      value={mKpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${mKpis.cpa.toFixed(2)} per action`} />
            <KpiCard label="ROAS"         value={mKpis.roas.toFixed(2) + "x"} sub={`€${mKpis.cpc.toFixed(2)} CPC`} />
            <KpiCard label="CTR"          value={`${(mKpis.ctr * 100).toFixed(2)}%`} />
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <SpendChart data={byDate} />
        <TopCampaignsChart campaigns={campaigns} metric="spend" label="Spend" />
      </div>

      {/* Campaign table */}
      <CampaignTable campaigns={campaigns} />
    </div>
  );
}
