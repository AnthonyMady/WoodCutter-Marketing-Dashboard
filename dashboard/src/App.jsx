import { useEffect, useState, useCallback } from "react";
import { initTokenClient, requestAccessToken, signOut } from "./lib/google.js";
import {
  filterByDate, filterByVenue, aggregateByDate, aggregateByCampaign,
  aggregateByCountry, computeKpis, getDateRange, getBrandOnlySpend,
} from "./lib/data.js";
import { useSheets } from "./hooks/useSheets.js";
import VenueFilter      from "./components/VenueFilter.jsx";
import BrandCallout     from "./components/BrandCallout.jsx";
import KpiCard          from "./components/KpiCard.jsx";
import DateFilter       from "./components/DateFilter.jsx";
import SpendChart       from "./components/SpendChart.jsx";
import TopCampaignsChart from "./components/TopCampaignsChart.jsx";
import CountryBreakdown from "./components/CountryBreakdown.jsx";
import CampaignTable    from "./components/CampaignTable.jsx";

const money = (n) => `€${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function App() {
  const [authed, setAuthed]     = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [preset, setPreset]     = useState("30d");
  const [venue, setVenue]       = useState("All venues");
  const { data, loading, error, load } = useSheets();

  useEffect(() => {
    const check = () => {
      if (window.google?.accounts?.oauth2) setGsiReady(true);
      else setTimeout(check, 100);
    };
    check();
  }, []);

  const handleToken = useCallback(() => { setAuthed(true); load(); }, [load]);

  useEffect(() => {
    if (gsiReady) initTokenClient(handleToken);
  }, [gsiReady, handleToken]);

  const handleSignIn  = () => requestAccessToken();
  const handleSignOut = () => { signOut(); setAuthed(false); };

  // Derived data
  const { start, end } = data ? getDateRange(preset, data.googleAds) : {};
  const byDate_all  = data ? filterByDate(data.googleAds, start, end) : [];
  const filtered    = filterByVenue(byDate_all, venue);
  const brandSpend  = venue !== "All venues" ? getBrandOnlySpend(byDate_all) : 0;
  const kpis       = computeKpis(filtered);
  const byDate     = aggregateByDate(filtered);
  const campaigns  = aggregateByCampaign(filtered);
  const countries  = aggregateByCountry(filtered);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f1a", padding: "28px 24px", maxWidth: 1280, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Marketing Dashboard
          </h1>
          {data?.meta?.last_updated && (
            <p style={{ fontSize: 12, color: "#475569", marginTop: 4, margin: 0 }}>
              Last synced {new Date(data.meta.last_updated).toLocaleString()} · Google Ads
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {authed && data && <DateFilter value={preset} onChange={setPreset} />}
          {authed && <button onClick={handleSignOut} style={btn("#1a1d2e", "#64748b")}>Sign out</button>}
        </div>
      </div>

      {/* Not signed in */}
      {!authed && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#0d0f1a", gap: 20,
        }}>
          <div style={{ fontSize: 56 }}>📊</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Marketing Dashboard
          </h2>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            Sign in to view your campaign performance
          </p>
          <button
            onClick={handleSignIn}
            disabled={!gsiReady}
            style={{
              marginTop: 8,
              background: "#4f8ef7", color: "#fff",
              border: "none", borderRadius: 10,
              padding: "14px 36px", fontSize: 16,
              fontWeight: 600, cursor: "pointer",
              opacity: gsiReady ? 1 : 0.5,
            }}
          >
            {gsiReady ? "Sign in with Google" : "Loading…"}
          </button>
        </div>
      )}

      {authed && loading && (
        <div style={{ textAlign: "center", marginTop: 100, color: "#475569" }}>
          <p style={{ fontSize: 16 }}>Loading data from Google Sheets…</p>
        </div>
      )}

      {authed && error && (
        <div style={{ background: "#2d1b1b", border: "1px solid #7f1d1d", borderRadius: 10, padding: 16, color: "#fca5a5", marginTop: 24 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {authed && data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Venue filter */}
          <VenueFilter value={venue} onChange={setVenue} />

          {/* Brand spend callout */}
          <BrandCallout spend={brandSpend} venue={venue} />

          {/* KPI Row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Spend"   value={money(kpis.spend)}       sub={`${filtered.length.toLocaleString()} campaign days`} accent="#4f8ef733" />
            <KpiCard label="Conversions"   value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} accent="#34d39933" />
            <KpiCard label="Conv. Value"   value={money(kpis.convValue)}   sub="total revenue attributed" accent="#34d39933" />
            <KpiCard label="ROAS"          value={kpis.roas.toFixed(2) + "x"} sub={`€${kpis.cpc.toFixed(2)} CPC`} accent="#f59e0b33" />
            <KpiCard label="Clicks"        value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} accent="#6366f133" />
            <KpiCard label="Impressions"   value={kpis.impressions.toLocaleString(undefined, { maximumFractionDigits: 0 })} accent="#6366f133" />
          </div>

          {/* Charts row 1 */}
          <SpendChart data={byDate} />

          {/* Charts row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <TopCampaignsChart campaigns={campaigns} metric="roas"  label="ROAS" />
            <TopCampaignsChart campaigns={campaigns} metric="spend" label="Spend" />
          </div>

          {/* Charts row 3 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
            <CountryBreakdown countries={countries} />
            <CampaignTable    campaigns={campaigns} />
          </div>

        </div>
      )}
    </div>
  );
}

function btn(bg, color) {
  return {
    background: bg, color, border: "1px solid #2d3348",
    borderRadius: 8, padding: "8px 18px",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  };
}
