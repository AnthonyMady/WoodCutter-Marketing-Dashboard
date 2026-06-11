import { useMemo } from "react";
import { aggregateByCampaign, num } from "../lib/data.js";

const money = (n) => `€${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pct   = (n) => `${(Number(n) * 100).toFixed(1)}%`;

export default function ActiveCampaignList({ rows, source = "google" }) {
  // rows are already date+venue filtered by the parent — just aggregate
  const active = useMemo(() => {
    return aggregateByCampaign(rows.filter(r => num(r.Cost) > 0)).filter(c => c.spend > 0);
  }, [rows]);

  const isGoogle = source === "google";
  const accentColor = isGoogle ? "#2563eb" : "#0866ff";

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Active campaigns</p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Selected period · {active.length} campaigns</p>
      </div>

      {active.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9ca3af" }}>No active campaigns in the last 7 days</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 70px", gap: 8, padding: "0 0 8px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Campaign</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Spend</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>{isGoogle ? "Conv." : "Actions"}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>{isGoogle ? "ROAS" : "CTR"}</span>
          </div>

          {active.map((c, i) => (
            <div key={c.campaign} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px 70px", gap: 8,
              padding: "9px 0",
              borderBottom: i < active.length - 1 ? "1px solid #f9fafb" : "none",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.campaign}>
                  {c.campaign}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, textAlign: "right" }}>{money(c.spend)}</span>
              <span style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>
                {c.conversions > 0 ? c.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
              </span>
              <span style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>
                {isGoogle
                  ? (c.roas > 0 ? `${c.roas.toFixed(2)}x` : "—")
                  : pct(c.ctr)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
