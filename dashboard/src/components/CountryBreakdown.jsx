import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4f8ef7", "#34d399", "#f59e0b", "#e05fff", "#64748b"];

export default function CountryBreakdown({ countries }) {
  const data = countries.map((c) => ({ name: c.country, value: c.spend }));
  const fmtEur = (v) => `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 12, padding: "24px 20px" }}>
      <h3 style={titleStyle}>Spend by Country</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
            paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#0f1117", border: "1px solid #2d3348", borderRadius: 8, fontSize: 13 }}
            formatter={(v) => [fmtEur(v), "Spend"]}
          />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>

      {/* Stats table below pie */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {countries.map((c, i) => (
          <div key={c.country} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: COLORS[i % COLORS.length], fontWeight: 500 }}>{c.country}</span>
            <span style={{ color: "#94a3b8" }}>{fmtEur(c.spend)}</span>
            <span style={{ color: "#64748b" }}>ROAS {c.roas.toFixed(2)}x</span>
            <span style={{ color: "#64748b" }}>{c.conversions.toFixed(0)} conv.</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const titleStyle = {
  color: "#94a3b8", fontSize: 12, marginBottom: 16,
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
};
