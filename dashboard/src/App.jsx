import { useEffect, useState, useCallback } from "react";
import { initTokenClient, requestAccessToken, signOut, getUserEmail } from "./lib/google.js";

const SHOOTERS_ALLOWED = [
  "anthony.mady.work@gmail.com",
  "romain2felix@gmail.com",
  "julien.vandenitte.work@gmail.com",
];
import {
  filterByDate, filterBrandCampaigns, aggregateByDate, aggregateByCampaign,
  computeKpis, getDateRange,
} from "./lib/data.js";
import { useSheets } from "./hooks/useSheets.js";
import KpiCard           from "./components/KpiCard.jsx";
import DateFilter        from "./components/DateFilter.jsx";
import SpendChart        from "./components/SpendChart.jsx";
import TopCampaignsChart from "./components/TopCampaignsChart.jsx";
import CampaignTable     from "./components/CampaignTable.jsx";
import PerformanceTab   from "./components/PerformanceTab.jsx";

const money = (n) => `€${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const NAV = [
  { icon: "▦", label: "Performance",     key: "performance" },
  { icon: "◉", label: "Brand Campaigns", key: "brand" },
  { icon: "🎯", label: "Shooters",       key: "shooters" },
];

const PAGE_TITLES = {
  performance: { title: "Performance",        sub: "Google Ads & Meta Ads · all venues" },
  brand:       { title: "Brand Campaigns",    sub: "Country-wide brand & generic campaigns" },
  shooters:    { title: "Shooters Brussels",  sub: "Shooters Brussels · restricted access" },
};

export default function App() {
  const [authed, setAuthed]       = useState(false);
  const [gsiReady, setGsiReady]   = useState(false);
  const [preset, setPreset]           = useState("30d");
  const [view, setView]               = useState("performance");
  const [customRange, setCustomRange] = useState(null);
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
      <div style={{ width: 200, background: "#fff", borderRight: "0.5px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 10 }}>
        <div style={{ padding: "20px 20px 16px" }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>
            WoodCutter <span style={{ color: "#185FA5" }}>Ads</span>
          </p>
        </div>

        <nav style={{ padding: "8px", flex: 1 }}>
          {NAV.map((n) => {
            const active = view === n.key;
            const isShooters = n.key === "shooters";
            return (
              <div key={n.key}>
                {isShooters && <div style={{ borderTop: "0.5px solid #f3f4f6", margin: "6px 0" }} />}
                <div onClick={() => setView(n.key)} style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 8,
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? "#185FA5" : "#6b7280",
                  background: active ? "#E6F1FB" : "transparent",
                  cursor: "pointer",
                }}>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {isShooters && !canSeeShooters && (
                    <span style={{ fontSize: 11, color: "#d1d5db" }}>🔒</span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "14px 20px", borderTop: "0.5px solid #f3f4f6" }}>
          {data?.meta?.last_updated && (
            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, background: "#22c55e", borderRadius: "50%", marginRight: 5, verticalAlign: "middle" }} />
              Synced {new Date(data.meta.last_updated).toLocaleDateString()}
            </p>
          )}
          <button onClick={handleSignOut} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 200, flex: 1, padding: "28px 28px", background: "#f9fafb", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 17, fontWeight: 500, color: "#111827" }}>
            {PAGE_TITLES[view].title}
          </h1>
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
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8, letterSpacing: "-0.3px" }}>
                Restricted Access
              </h2>
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
            {/* ── PERFORMANCE ── */}
            {view === "performance" && (
              <PerformanceTab data={data} start={start} end={end} canSeeShooters={canSeeShooters} />
            )}

            {/* ── BRAND ── */}
            {view === "brand" && (() => {
              const brandRows      = filterBrandCampaigns(filterByDate(data.googleAds, start, end));
              const brandKpis      = computeKpis(brandRows);
              const brandByDate    = aggregateByDate(brandRows);
              const brandCampaigns = aggregateByCampaign(brandRows);
              return (
                <>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                    <KpiCard label="Total Spend"  value={money(brandKpis.spend)} />
                    <KpiCard label="Conversions"  value={brandKpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${brandKpis.cpa.toFixed(2)} CPA`} />
                    <KpiCard label="ROAS"         value={brandKpis.roas.toFixed(2) + "x"} sub={`€${brandKpis.cpc.toFixed(2)} CPC`} />
                    <KpiCard label="Clicks"       value={brandKpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(brandKpis.ctr * 100).toFixed(2)}% CTR`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
                    <SpendChart data={brandByDate} />
                    <TopCampaignsChart campaigns={brandCampaigns} metric="roas" label="ROAS" />
                  </div>
                  <CampaignTable campaigns={brandCampaigns} />
                </>
              );
            })()}

            {/* ── SHOOTERS ── */}
            {view === "shooters" && canSeeShooters && (() => {
              const shootersRows      = filterByDate(data.googleAds, start, end).filter(
                (r) => { const v = (r.CampaignName || "").toLowerCase(); return /shooters|shooting.?bar|schietbar|exp.?rience.?tir/.test(v); }
              );
              const shootersKpis      = computeKpis(shootersRows);
              const shootersByDate    = aggregateByDate(shootersRows);
              const shootersCampaigns = aggregateByCampaign(shootersRows);
              return (
                <>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                    <KpiCard label="Total Spend"  value={money(shootersKpis.spend)} />
                    <KpiCard label="Conversions"  value={shootersKpis.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`€${shootersKpis.cpa.toFixed(2)} CPA`} />
                    <KpiCard label="ROAS"         value={shootersKpis.roas.toFixed(2) + "x"} sub={`€${shootersKpis.cpc.toFixed(2)} CPC`} />
                    <KpiCard label="Clicks"       value={shootersKpis.clicks.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub={`${(shootersKpis.ctr * 100).toFixed(2)}% CTR`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
                    <SpendChart data={shootersByDate} />
                    <TopCampaignsChart campaigns={shootersCampaigns} metric="roas" label="ROAS" />
                  </div>
                  <CampaignTable campaigns={shootersCampaigns} />
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
