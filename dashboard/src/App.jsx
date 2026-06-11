import { useEffect, useState, useCallback } from "react";
import { initTokenClient, requestAccessToken, signOut, getUserEmail } from "./lib/google.js";

const SHOOTERS_ALLOWED = [
  "anthony.mady.work@gmail.com",
  "romain2felix@gmail.com",
  "julien.vandenitte.work@gmail.com",
];

import {
  filterByDate, filterByVenue, filterBrandCampaigns, excludeShooters,
  aggregateByDate, aggregateByCampaign, aggregateByCountry,
  computeKpis, getDateRange, normaliseMetaRow, num,
} from "./lib/data.js";
import { useSheets } from "./hooks/useSheets.js";
import KpiCard           from "./components/KpiCard.jsx";
import DateFilter        from "./components/DateFilter.jsx";
import VenueFilter       from "./components/VenueFilter.jsx";
import SpendChart        from "./components/SpendChart.jsx";
import TopCampaignsChart from "./components/TopCampaignsChart.jsx";
import CountryBreakdown  from "./components/CountryBreakdown.jsx";
import CampaignTable     from "./components/CampaignTable.jsx";

const money = (n) => `€${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const NAV_SECTIONS = [
  {
    label: "Google Ads",
    items: [
      { label: "Overview",  key: "google-overview" },
      { label: "Venues",    key: "google-venues" },
    ],
  },
  {
    label: "Meta Ads",
    items: [
      { label: "Overview",  key: "meta-overview" },
    ],
  },
  {
    label: "Blend",
    items: [
      { label: "Overview",  key: "blend-overview" },
    ],
  },
];

const PAGE_TITLES = {
  "google-overview": { title: "Google Ads · Overview",    sub: "All WoodCutter venues" },
  "google-venues":   { title: "Google Ads · Venues",      sub: "Performance by location" },
  "meta-overview":   { title: "Meta Ads · Overview",      sub: "All WoodCutter venues" },
  "blend-overview":  { title: "Blend · Overview",         sub: "Google Ads + Meta Ads combined" },
  "shooters":        { title: "Shooters Brussels",        sub: "Restricted access" },
};

export default function App() {
  const [authed, setAuthed]           = useState(false);
  const [gsiReady, setGsiReady]       = useState(false);
  const [preset, setPreset]           = useState("30d");
  const [customRange, setCustomRange] = useState(null);
  const [venue, setVenue]             = useState("All venues");
  const [view, setView]               = useState("google-overview");
  const [userEmail, setUserEmail]     = useState(null);
  const { data, loading, error, load } = useSheets();

  const canSeeShooters = SHOOTERS_ALLOWED.includes(userEmail);

  useEffect(() => {
    const check = () => {
      if (window.google?.accounts?.oauth2) setGsiReady(true);
      else setTimeout(check, 100);
    };
    check();
  }, []);

  const handleToken = useCallback(() => {
    setAuthed(true);
    setUserEmail(getUserEmail());
    load();
  }, [load]);
  useEffect(() => { if (gsiReady) initTokenClient(handleToken); }, [gsiReady, handleToken]);

  const handleSignIn  = () => requestAccessToken();
  const handleSignOut = () => { signOut(); setAuthed(false); setUserEmail(null); };

  const handleVenueChange = (v) => {
    if (v === "Shooters Brussels" && !canSeeShooters) return;
    setVenue(v);
  };

  const { start, end } = data ? getDateRange(preset, data.googleAds, customRange) : {};

  // Sign-in screen
  if (!authed) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "48px 56px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6, letterSpacing: "-0.4px" }}>WoodCutter Marketing</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>Sign in to view your campaign performance</p>
          <button onClick={handleSignIn} disabled={!gsiReady}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: gsiReady ? 1 : 0.5 }}>
            {gsiReady ? "Sign in with Google" : "Loading…"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 10 }}>
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
            Wood<span style={{ color: "#2563eb" }}>Cutter</span> Ads
          </p>
        </div>

        <nav style={{ padding: "12px", flex: 1, overflowY: "auto" }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", padding: "8px 12px 4px" }}>
                {section.label}
              </p>
              {section.items.map((item) => {
                const active = view === item.key;
                return (
                  <div key={item.key} onClick={() => setView(item.key)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8,
                    fontSize: 13.5, fontWeight: 500,
                    color: active ? "#2563eb" : "#6b7280",
                    background: active ? "#eff6ff" : "transparent",
                    marginBottom: 1, cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    {item.label}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Shooters separator + item */}
          <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 8, paddingTop: 8 }}>
            <div onClick={() => setView("shooters")} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8,
              fontSize: 13.5, fontWeight: 500,
              color: view === "shooters" ? "#2563eb" : "#9ca3af",
              background: view === "shooters" ? "#eff6ff" : "transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <span style={{ flex: 1 }}>Shooters</span>
              {!canSeeShooters && <span style={{ fontSize: 10, color: "#d1d5db" }}>🔒</span>}
            </div>
          </div>
        </nav>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6" }}>
          {data?.meta?.last_updated && (
            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, background: "#22c55e", borderRadius: "50%", marginRight: 6, verticalAlign: "middle" }} />
              Synced {new Date(data.meta.last_updated).toLocaleDateString()}
            </p>
          )}
          <button onClick={handleSignOut} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, padding: "32px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px" }}>
              {PAGE_TITLES[view].title}
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>{PAGE_TITLES[view].sub}</p>
          </div>
          {data && (view !== "shooters" || canSeeShooters) && (
            <DateFilter
              value={preset} onChange={setPreset}
              customRange={customRange} onCustomRange={setCustomRange}
            />
          )}
        </div>

        {loading && <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 80 }}>Loading data…</p>}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 16, color: "#991b1b", fontSize: 13 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* ── SHOOTERS ACCESS DENIED ── */}
        {view === "shooters" && !canSeeShooters && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "48px 56px", textAlign: "center", maxWidth: 420, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 56, height: 56, background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>
                🔒
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8, letterSpacing: "-0.3px" }}>Restricted Access</h2>
              <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
                The Shooters Brussels section is only available to authorised team members.
                If you need access, please contact your administrator.
              </p>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#9ca3af" }}>
                Signed in as <strong style={{ color: "#374151" }}>{userEmail ?? "unknown"}</strong>
              </div>
            </div>
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── GOOGLE ADS · OVERVIEW ── */}
            {view === "google-overview" && (() => {
              const rows      = excludeShooters(filterByDate(data.googleAds, start, end));
              const kpis      = computeKpis(rows);
              const byDate    = aggregateByDate(rows);
              const campaigns = aggregateByCampaign(rows);
              const countries = aggregateByCountry(rows);
              return (
                <>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                    <KpiCard label="Total Spend"  value={money(kpis.spend)}       sub={`${rows.length.toLocaleString()} campaign days`} />
                    <KpiCard label="Conversions"  value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} />
                    <KpiCard label="Conv. Value"  value={money(kpis.convValue)}   sub="revenue attributed" />
                    <KpiCard label="ROAS"         value={kpis.roas.toFixed(2) + "x"} sub={`€${kpis.cpc.toFixed(2)} CPC`} />
                    <KpiCard label="Clicks"       value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} />
                    <KpiCard label="Impressions"  value={kpis.impressions.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                    <SpendChart data={byDate} />
                    <CountryBreakdown countries={countries} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <TopCampaignsChart campaigns={campaigns} metric="roas"  label="ROAS" />
                    <TopCampaignsChart campaigns={campaigns} metric="spend" label="Spend" />
                  </div>
                </>
              );
            })()}

            {/* ── GOOGLE ADS · VENUES ── */}
            {view === "google-venues" && (() => {
              const allRows   = excludeShooters(filterByDate(data.googleAds, start, end));
              const filtered  = filterByVenue(allRows, venue);
              const kpis      = computeKpis(filtered);
              const byDate    = aggregateByDate(filtered);
              const campaigns = aggregateByCampaign(filtered);
              const countries = aggregateByCountry(filtered);
              return (
                <>
                  <VenueFilter value={venue} onChange={handleVenueChange} />
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                    <KpiCard label="Total Spend"  value={money(kpis.spend)} sub={venue} />
                    <KpiCard label="Conversions"  value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} />
                    <KpiCard label="Conv. Value"  value={money(kpis.convValue)} />
                    <KpiCard label="ROAS"         value={kpis.roas.toFixed(2) + "x"} sub={`€${kpis.cpc.toFixed(2)} CPC`} />
                    <KpiCard label="Clicks"       value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                    <SpendChart data={byDate} />
                    <CountryBreakdown countries={countries} />
                  </div>
                  <CampaignTable campaigns={campaigns} />
                </>
              );
            })()}

            {/* ── META ADS · OVERVIEW ── */}
            {view === "meta-overview" && (() => {
              const rows      = excludeShooters(filterByDate((data.metaAds ?? []).map(normaliseMetaRow), start, end));
              const kpis      = computeKpis(rows);
              const byDate    = aggregateByDate(rows);
              const campaigns = aggregateByCampaign(rows);
              const countries = aggregateByCountry(rows);
              return (
                <>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                    <KpiCard label="Total Spend"  value={money(kpis.spend)}       sub={`${rows.length.toLocaleString()} campaign days`} />
                    <KpiCard label="Actions"      value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={kpis.conversions > 0 ? `€${kpis.cpa.toFixed(2)} per action` : undefined} />
                    <KpiCard label="Clicks"       value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} />
                    <KpiCard label="CPC"          value={`€${kpis.cpc.toFixed(2)}`} />
                    <KpiCard label="Impressions"  value={kpis.impressions.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                    <SpendChart data={byDate} />
                    <CountryBreakdown countries={countries} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <TopCampaignsChart campaigns={campaigns} metric="spend" label="Spend" />
                    <TopCampaignsChart campaigns={campaigns} metric="clicks" label="Clicks" />
                  </div>
                </>
              );
            })()}

            {/* ── BLEND · OVERVIEW ── */}
            {view === "blend-overview" && (() => {
              const gRows  = excludeShooters(filterByDate(data.googleAds, start, end));
              const mRows  = excludeShooters(filterByDate((data.metaAds ?? []).map(normaliseMetaRow), start, end));
              const gKpis  = computeKpis(gRows);
              const mKpis  = computeKpis(mRows);
              const totalSpend = gKpis.spend + mKpis.spend;

              // Merge spend by date for chart
              const dateMap = {};
              for (const r of gRows) {
                if (!r.Date) continue;
                dateMap[r.Date] = (dateMap[r.Date] ?? 0) + num(r.Cost);
              }
              for (const r of mRows) {
                if (!r.Date) continue;
                dateMap[r.Date] = (dateMap[r.Date] ?? 0) + num(r.Cost);
              }
              const blendByDate = Object.entries(dateMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, spend]) => ({ date, spend, clicks: 0, impressions: 0, conversions: 0, convValue: 0 }));

              const gCampaigns = aggregateByCampaign(gRows);
              const mCampaigns = aggregateByCampaign(mRows);

              return (
                <>
                  {/* Split KPI row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    {/* Google Ads block */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                        Google Ads · {Math.round(gKpis.spend / (totalSpend || 1) * 100)}% of spend
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <KpiCard label="Spend"       value={money(gKpis.spend)} />
                        <KpiCard label="ROAS"        value={gKpis.roas.toFixed(2) + "x"} sub={`€${gKpis.cpc.toFixed(2)} CPC`} />
                        <KpiCard label="Conversions" value={gKpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={gKpis.conversions > 0 ? `€${gKpis.cpa.toFixed(2)} CPA` : undefined} />
                      </div>
                    </div>
                    {/* Meta Ads block */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#0866ff", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                        Meta Ads · {Math.round(mKpis.spend / (totalSpend || 1) * 100)}% of spend
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <KpiCard label="Spend"   value={money(mKpis.spend)} />
                        <KpiCard label="Clicks"  value={mKpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(mKpis.ctr * 100).toFixed(2)}% CTR`} />
                        <KpiCard label="Actions" value={mKpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={mKpis.conversions > 0 ? `€${mKpis.cpa.toFixed(2)} / action` : undefined} />
                      </div>
                    </div>
                  </div>

                  {/* Combined spend chart */}
                  <div style={{ marginBottom: 16 }}>
                    <SpendChart data={blendByDate} />
                  </div>

                  {/* Top campaigns side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", marginBottom: 10 }}>Google Ads · top campaigns</p>
                      <TopCampaignsChart campaigns={gCampaigns} metric="spend" label="Spend" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0866ff", marginBottom: 10 }}>Meta Ads · top campaigns</p>
                      <TopCampaignsChart campaigns={mCampaigns} metric="spend" label="Spend" />
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── SHOOTERS ── */}
            {view === "shooters" && canSeeShooters && (() => {
              const rows      = filterByDate(data.googleAds, start, end).filter(
                (r) => { const v = (r.CampaignName || "").toLowerCase(); return /shooters|shooting.?bar|schietbar|exp.?rience.?tir/.test(v); }
              );
              const kpis      = computeKpis(rows);
              const byDate    = aggregateByDate(rows);
              const campaigns = aggregateByCampaign(rows);
              return (
                <>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                    <KpiCard label="Total Spend"  value={money(kpis.spend)}       sub="Shooters Brussels" />
                    <KpiCard label="Conversions"  value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} />
                    <KpiCard label="Conv. Value"  value={money(kpis.convValue)} />
                    <KpiCard label="ROAS"         value={kpis.roas.toFixed(2) + "x"} sub={`€${kpis.cpc.toFixed(2)} CPC`} />
                    <KpiCard label="Clicks"       value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                    <SpendChart data={byDate} />
                    <TopCampaignsChart campaigns={campaigns} metric="roas" label="ROAS" />
                  </div>
                  <CampaignTable campaigns={campaigns} />
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
