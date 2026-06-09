import { useEffect, useState, useCallback } from "react";
import { initTokenClient, requestAccessToken, signOut, getUserEmail } from "./lib/google.js";

const SHOOTERS_ALLOWED = [
  "anthony.mady.work@gmail.com",
  "romain2felix@gmail.com",
  "julien.vandenitte.work@gmail.com",
];
import {
  filterByDate, filterByVenue, aggregateByDate, aggregateByCampaign,
  aggregateByCountry, computeKpis, getDateRange, getBrandOnlySpend,
} from "./lib/data.js";
import { useSheets } from "./hooks/useSheets.js";
import KpiCard           from "./components/KpiCard.jsx";
import DateFilter        from "./components/DateFilter.jsx";
import VenueFilter       from "./components/VenueFilter.jsx";
import BrandCallout      from "./components/BrandCallout.jsx";
import SpendChart        from "./components/SpendChart.jsx";
import TopCampaignsChart from "./components/TopCampaignsChart.jsx";
import CountryBreakdown  from "./components/CountryBreakdown.jsx";
import CampaignTable     from "./components/CampaignTable.jsx";

const money = (n) => `€${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const NAV = [
  { icon: "▦", label: "Overview",   key: "overview" },
  { icon: "◎", label: "Campaigns",  key: "campaigns" },
  { icon: "◈", label: "Venues",     key: "venues" },
];

export default function App() {
  const [authed, setAuthed]     = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [preset, setPreset]     = useState("30d");
  const [venue, setVenue]       = useState("All venues");
  const [view, setView]         = useState("overview");
  const [userEmail, setUserEmail] = useState(null);
  const { data, loading, error, load } = useSheets();

  const canSeeShooters = SHOOTERS_ALLOWED.includes(userEmail);

  useEffect(() => {
    const check = () => {
      if (window.google?.accounts?.oauth2) setGsiReady(true);
      else setTimeout(check, 100);
    };
    check();
  }, []);

  const handleToken = useCallback(async () => {
    setAuthed(true);
    const email = await getUserEmail();
    setUserEmail(email);
    load();
  }, [load]);
  useEffect(() => { if (gsiReady) initTokenClient(handleToken); }, [gsiReady, handleToken]);

  const handleSignIn  = () => requestAccessToken();
  const handleSignOut = () => { signOut(); setAuthed(false); setUserEmail(null); };

  const handleVenueChange = (v) => {
    if (v === "Shooters Brussels" && !canSeeShooters) return;
    setVenue(v);
  };

  const { start, end } = data ? getDateRange(preset, data.googleAds) : {};
  const byDate_all = data ? filterByDate(data.googleAds, start, end) : [];
  const filtered   = filterByVenue(byDate_all, venue);
  const brandSpend = (venue !== "All venues" && venue !== "Shooters Brussels") ? getBrandOnlySpend(byDate_all) : 0;
  const kpis       = computeKpis(filtered);
  const byDate     = aggregateByDate(filtered);
  const campaigns  = aggregateByCampaign(filtered);
  const countries  = aggregateByCountry(filtered);

  const PAGE_TITLES = {
    overview:  { title: "Campaign Overview",    sub: `Google Ads · ${start ?? "…"} → ${end ?? "…"}` },
    campaigns: { title: "Campaign Performance", sub: "Detailed campaign breakdown" },
    venues:    { title: "Venue Analysis",       sub: "Performance by location" },
  };

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

        <nav style={{ padding: "12px", flex: 1 }}>
          {NAV.map((n) => {
            const active = view === n.key;
            return (
              <div key={n.key} onClick={() => setView(n.key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8,
                fontSize: 13.5, fontWeight: 500,
                color: active ? "#2563eb" : "#6b7280",
                background: active ? "#eff6ff" : "transparent",
                marginBottom: 2, cursor: "pointer",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 14 }}>{n.icon}</span>
                {n.label}
              </div>
            );
          })}
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
          {data && <DateFilter value={preset} onChange={setPreset} />}
        </div>

        {loading && <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 80 }}>Loading data…</p>}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 16, color: "#991b1b", fontSize: 13 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── OVERVIEW ── */}
            {view === "overview" && (
              <>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                  <KpiCard label="Total Spend"  value={money(kpis.spend)}       sub={`${byDate_all.length.toLocaleString()} campaign days`} />
                  <KpiCard label="Conversions"  value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} />
                  <KpiCard label="Conv. Value"  value={money(kpis.convValue)}   sub="revenue attributed" />
                  <KpiCard label="ROAS"         value={kpis.roas.toFixed(2) + "x"} sub={`€${kpis.cpc.toFixed(2)} CPC`} />
                  <KpiCard label="Clicks"       value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} />
                  <KpiCard label="Impressions"  value={kpis.impressions.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                  <SpendChart data={aggregateByDate(filterByDate(data.googleAds, start, end))} />
                  <CountryBreakdown countries={aggregateByCountry(filterByDate(data.googleAds, start, end))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <TopCampaignsChart campaigns={aggregateByCampaign(filterByDate(data.googleAds, start, end))} metric="roas"  label="ROAS" />
                  <TopCampaignsChart campaigns={aggregateByCampaign(filterByDate(data.googleAds, start, end))} metric="spend" label="Spend" />
                </div>
              </>
            )}

            {/* ── CAMPAIGNS ── */}
            {view === "campaigns" && (
              <>
                <VenueFilter value={venue} onChange={handleVenueChange} canSeeShooters={canSeeShooters} />
                <BrandCallout spend={brandSpend} venue={venue} />
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                  <KpiCard label="Total Spend"  value={money(kpis.spend)} />
                  <KpiCard label="ROAS"         value={kpis.roas.toFixed(2) + "x"} sub={`€${kpis.cpc.toFixed(2)} CPC`} />
                  <KpiCard label="Conversions"  value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} />
                  <KpiCard label="Clicks"       value={kpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(kpis.ctr * 100).toFixed(2)}% CTR`} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <TopCampaignsChart campaigns={campaigns} metric="roas"  label="ROAS" />
                  <TopCampaignsChart campaigns={campaigns} metric="spend" label="Spend" />
                </div>
                <CampaignTable campaigns={campaigns} />
              </>
            )}

            {/* ── VENUES ── */}
            {view === "venues" && (
              <>
                <VenueFilter value={venue} onChange={handleVenueChange} canSeeShooters={canSeeShooters} />
                <BrandCallout spend={brandSpend} venue={venue} />
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                  <KpiCard label="Total Spend"  value={money(kpis.spend)} sub={venue} />
                  <KpiCard label="Conversions"  value={kpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${kpis.cpa.toFixed(2)} CPA`} />
                  <KpiCard label="Conv. Value"  value={money(kpis.convValue)} />
                  <KpiCard label="ROAS"         value={kpis.roas.toFixed(2) + "x"} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                  <SpendChart data={byDate} />
                  <CountryBreakdown countries={countries} />
                </div>
                <CampaignTable campaigns={campaigns} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
