import { useState } from "react";

const COLS = [
  { key: "campaign",    label: "Campaign",     fmt: (v) => v },
  { key: "country",     label: "Country",      fmt: (v) => v },
  { key: "type",        label: "Type",         fmt: (v) => v },
  { key: "spend",       label: "Spend",        fmt: (v) => `€${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
  { key: "clicks",      label: "Clicks",       fmt: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
  { key: "impressions", label: "Impr.",         fmt: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
  { key: "ctr",         label: "CTR",          fmt: (v) => `${(v * 100).toFixed(2)}%` },
  { key: "cpc",         label: "CPC",          fmt: (v) => `€${v.toFixed(2)}` },
  { key: "conversions", label: "Conv.",        fmt: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: "roas",        label: "ROAS",         fmt: (v) => v.toFixed(2) + "x" },
];

export default function CampaignTable({ campaigns }) {
  const [sortKey, setSortKey]   = useState("spend");
  const [sortDir, setSortDir]   = useState(-1); // -1 = desc
  const [search, setSearch]     = useState("");

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const filtered = campaigns
    .filter((c) => c.campaign.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir * (a[sortKey] > b[sortKey] ? 1 : -1));

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 12, padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={titleStyle}>Campaign Performance</h3>
        <input
          placeholder="Search campaigns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "#0f1117", border: "1px solid #2d3348", borderRadius: 8,
            color: "#e2e8f0", padding: "6px 12px", fontSize: 13, outline: "none",
          }}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{
                    textAlign: "left", color: sortKey === c.key ? "#4f8ef7" : "#64748b",
                    fontWeight: 600, paddingBottom: 10, paddingRight: 16,
                    borderBottom: "1px solid #22263a", cursor: "pointer", userSelect: "none",
                    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                  {c.label} {sortKey === c.key ? (sortDir === -1 ? "↓" : "↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #181b29" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#22263a"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                {COLS.map((c) => (
                  <td key={c.key} style={{ padding: "9px 16px 9px 0", color: c.key === "campaign" ? "#e2e8f0" : "#94a3b8" }}>
                    {c.fmt(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>No campaigns match your search.</p>
        )}
      </div>
    </div>
  );
}

const titleStyle = {
  color: "#94a3b8", fontSize: 12, margin: 0,
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
};
