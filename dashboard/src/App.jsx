import { useEffect, useState, useCallback } from "react";
import { initTokenClient, requestAccessToken, signOut } from "./lib/google.js";
import { useSheets } from "./hooks/useSheets.js";
import KpiCard from "./components/KpiCard.jsx";
import SpendChart from "./components/SpendChart.jsx";
import PerformanceTable from "./components/PerformanceTable.jsx";

const sum   = (rows, key) => rows.reduce((a, r) => a + parseFloat(r[key] || 0), 0);
const money = (n)         => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const GOOGLE_COLS = [
  { key: "CampaignName",    label: "Campaign" },
  { key: "Impressions",     label: "Impressions", type: "number" },
  { key: "Clicks",          label: "Clicks",      type: "number" },
  { key: "Cost",            label: "Spend",        type: "currency" },
  { key: "CTR",             label: "CTR",          type: "percent" },
  { key: "CPC",             label: "CPC",          type: "currency" },
  { key: "Conversions",     label: "Conv.",        type: "number" },
  { key: "ROAS",            label: "ROAS" },
];

const META_COLS = [
  { key: "campaign_name",   label: "Campaign" },
  { key: "impressions",     label: "Impressions", type: "number" },
  { key: "clicks",          label: "Clicks",      type: "number" },
  { key: "spend",           label: "Spend",        type: "currency" },
  { key: "ctr",             label: "CTR",          type: "percent" },
  { key: "cpc",             label: "CPC",          type: "currency" },
  { key: "purchase_roas",   label: "ROAS" },
];

export default function App() {
  const [authed, setAuthed]   = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const { data, loading, error, load } = useSheets();

  // Wait for GSI script to load
  useEffect(() => {
    const check = () => {
      if (window.google?.accounts?.oauth2) {
        setGsiReady(true);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }, []);

  const handleToken = useCallback((_token) => {
    setAuthed(true);
    load();
  }, [load]);

  useEffect(() => {
    if (gsiReady) initTokenClient(handleToken);
  }, [gsiReady, handleToken]);

  const handleSignIn  = () => requestAccessToken();
  const handleSignOut = () => { signOut(); setAuthed(false); };

  // --- KPIs ---
  const gSpend       = data ? sum(data.googleAds, "Cost")        : 0;
  const mSpend       = data ? sum(data.metaAds,   "spend")       : 0;
  const gClicks      = data ? sum(data.googleAds, "Clicks")      : 0;
  const mClicks      = data ? sum(data.metaAds,   "clicks")      : 0;
  const gConversions = data ? sum(data.googleAds, "Conversions") : 0;

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9" }}>Marketing Dashboard</h1>
          {data?.meta?.last_updated && (
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Last synced: {new Date(data.meta.last_updated).toLocaleString()} ·{" "}
              {data.meta.date_start} → {data.meta.date_end}
            </p>
          )}
        </div>

        {authed ? (
          <button onClick={handleSignOut} style={btnStyle("#2d3348", "#94a3b8")}>
            Sign out
          </button>
        ) : (
          <button onClick={handleSignIn} disabled={!gsiReady} style={btnStyle("#4f8ef7", "#fff")}>
            {gsiReady ? "Sign in with Google" : "Loading…"}
          </button>
        )}
      </div>

      {/* Not signed in */}
      {!authed && (
        <div style={{ textAlign: "center", marginTop: 100, color: "#64748b" }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Sign in with Google to view your marketing data</p>
          <p style={{ fontSize: 13 }}>Access is limited to accounts with permission on the data sheet.</p>
        </div>
      )}

      {/* Loading */}
      {authed && loading && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: 80 }}>Loading data from Google Sheets…</p>
      )}

      {/* Error */}
      {authed && error && (
        <div style={{ background: "#2d1b1b", border: "1px solid #7f1d1d", borderRadius: 8, padding: 16, color: "#fca5a5", marginTop: 24 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Dashboard */}
      {authed && data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* KPI row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <KpiCard label="Google Spend"   value={money(gSpend)}       sub="last 30 days" />
            <KpiCard label="Meta Spend"     value={money(mSpend)}       sub="last 30 days" />
            <KpiCard label="Total Spend"    value={money(gSpend + mSpend)} sub="combined" />
            <KpiCard label="Google Clicks"  value={gClicks.toLocaleString()} />
            <KpiCard label="Meta Clicks"    value={mClicks.toLocaleString()} />
            <KpiCard label="Conversions"    value={gConversions.toLocaleString()} sub="Google Ads" />
          </div>

          {/* Spend over time */}
          <SpendChart googleAds={data.googleAds} metaAds={data.metaAds} />

          {/* Campaign tables */}
          <PerformanceTable title="Google Ads — Campaigns" rows={data.googleAds} columns={GOOGLE_COLS} />
          <PerformanceTable title="Meta Ads — Campaigns"   rows={data.metaAds}   columns={META_COLS}   />
        </div>
      )}
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    background: bg, color, border: "none", borderRadius: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "opacity 0.15s",
  };
}
