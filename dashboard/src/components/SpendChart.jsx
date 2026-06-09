import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/**
 * Props:
 *   googleAds  – array of Google Ads row objects
 *   metaAds    – array of Meta Ads row objects
 */
export default function SpendChart({ googleAds, metaAds }) {
  // Build a unified date-keyed map
  const byDate = {};

  for (const row of googleAds) {
    const d = row.Date;
    if (!d) continue;
    byDate[d] = byDate[d] ?? { date: d };
    byDate[d].google = (byDate[d].google ?? 0) + parseFloat(row.Cost || 0);
  }

  for (const row of metaAds) {
    const d = row.date_start;
    if (!d) continue;
    byDate[d] = byDate[d] ?? { date: d };
    byDate[d].meta = (byDate[d].meta ?? 0) + parseFloat(row.spend || 0);
  }

  const chartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ background: "#1e2130", borderRadius: 12, padding: "24px 20px" }}>
      <h3 style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Daily Spend
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`} />
          <Tooltip
            contentStyle={{ background: "#0f1117", border: "1px solid #2d3348", borderRadius: 8 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(v, name) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, name]}
          />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          <Line type="monotone" dataKey="google" name="Google Ads" stroke="#4f8ef7" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="meta"   name="Meta Ads"   stroke="#e05fff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
