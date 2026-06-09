import { useState } from "react";

const TYPE_COLORS = {
  "Performance Max": { bg: "#f5f3ff", color: "#7c3aed" },
  "Brand":           { bg: "#eff6ff", color: "#2563eb" },
  "Generic":         { bg: "#fff7ed", color: "#ea580c" },
  "Search":          { bg: "#f0fdf4", color: "#16a34a" },
  "Other":           { bg: "#f3f4f6", color: "#6b7280" },
};

const COLS = [
  { key: "campaign",    label: "Campaign",   fmt: (v) => v },
  { key: "type",        label: "Type",       fmt: (v) => v, badge: true },
  { key: "spend",       label: "Spend",      fmt: (v) => `€${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
  { key: "clicks",      label: "Clicks",     fmt: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
  { key: "ctr",         label: "CTR",        fmt: (v) => `${(v * 100).toFixed(2)}%` },
  { key: "cpc",         label: "CPC",        fmt: (v) => `€${v.toFixed(2)}` },
  { key: "conversions", label: "Conv.",      fmt: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: "roas",        label: "ROAS",       fmt: (v) => v.toFixed(2) + "x" },
];

export default function CampaignTable({ campaigns }) {
  const [sortKey, setSortKey] = useState("spend");
  const [sortDir, setSortDir] = useState(-1);
  const [search, setSearch]   = useState("");

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const filtered = campaigns
    .filter((c) => c.campaign.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir * (a[sortKey] > b[sortKey] ? 1 : -1));

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Campaign Performance</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Sorted by {sortKey} · click header to sort</p>
        </div>
        <input
          placeholder="Search campaigns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
            color: "#374151", padding: "7px 12px", fontSize: 13, outline: "none", width: 220,
          }}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} onClick={() => handleSort(c.key)} style={{
                  textAlign: "left", fontSize: 11, fontWeight: 600,
                  color: sortKey === c.key ? "#2563eb" : "#9ca3af",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  paddingBottom: 12, paddingRight: 16,
                  borderBottom: "1px solid #f3f4f6", cursor: "pointer", userSelect: "none",
                }}>
                  {c.label} {sortKey === c.key ? (sortDir === -1 ? "↓" : "↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                {COLS.map((c) => (
                  <td key={c.key} style={{ padding: "10px 16px 10px 0", color: c.key === "campaign" ? "#111827" : "#6b7280", fontWeight: c.key === "campaign" ? 500 : 400, maxWidth: c.key === "campaign" ? 220 : "unset", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.badge ? (
                      <span style={{ ...TYPE_COLORS[row[c.key]] ?? TYPE_COLORS["Other"], padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                        {c.fmt(row[c.key])}
                      </span>
                    ) : c.fmt(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 24, fontSize: 13 }}>No campaigns match your search.</p>
        )}
      </div>
    </div>
  );
}
