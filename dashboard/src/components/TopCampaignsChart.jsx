import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = ["#4f8ef7","#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#818cf8","#60a5fa","#38bdf8"];

export default function TopCampaignsChart({ campaigns, metric = "roas", label = "ROAS" }) {
  const top = [...campaigns]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, 8);

  const fmt = (v) =>
    metric === "spend"
      ? `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const shortName = (n) => n.length > 28 ? n.slice(0, 26) + "…" : n;

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 12, padding: "24px 20px" }}>
      <h3 style={titleStyle}>Top Campaigns — {label}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#22263a" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false}
            axisLine={false} tickFormatter={fmt} />
          <YAxis type="category" dataKey="campaign" width={180}
            tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={shortName} />
          <Tooltip
            contentStyle={{ background: "#0f1117", border: "1px solid #2d3348", borderRadius: 8, fontSize: 13 }}
            formatter={(v) => [fmt(v), label]}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
            {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const titleStyle = {
  color: "#94a3b8", fontSize: 12, marginBottom: 16,
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
};
