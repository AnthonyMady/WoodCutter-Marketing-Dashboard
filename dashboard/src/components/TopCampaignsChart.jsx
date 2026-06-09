import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TopCampaignsChart({ campaigns, metric = "roas", label = "ROAS" }) {
  const top = [...campaigns].sort((a, b) => b[metric] - a[metric]).slice(0, 7);

  const fmt = (v) =>
    metric === "spend"
      ? `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const shortName = (n) => n.length > 26 ? n.slice(0, 24) + "…" : n;

  return (
    <div style={card}>
      <p style={title}>Top Campaigns — {label}</p>
      <p style={sub}>Current period · best performing</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false}
            axisLine={false} tickFormatter={fmt} />
          <YAxis type="category" dataKey="campaign" width={175}
            tick={{ fill: "#374151", fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={shortName} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
            labelStyle={{ color: "#111827", fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: "#374151" }}
            formatter={(v) => [fmt(v), label]}
          />
          <Bar dataKey={metric} fill="#2563eb22" stroke="#2563eb" strokeWidth={1} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const card  = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" };
const title = { fontSize: 13, fontWeight: 600, color: "#374151" };
const sub   = { fontSize: 12, color: "#9ca3af", marginTop: 2, marginBottom: 20 };
