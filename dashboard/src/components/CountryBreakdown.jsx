import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#9ca3af"];

export default function CountryBreakdown({ countries }) {
  const data = countries.map((c) => ({ name: c.country, value: parseFloat(c.spend.toFixed(2)) }));
  const fmtEur = (v) => `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={card}>
      <p style={title}>Spend by Country</p>
      <p style={sub}>Current period breakdown</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
            paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
            itemStyle={{ color: "#374151" }}
            formatter={(v) => [fmtEur(v), "Spend"]}
          />
          <Legend wrapperStyle={{ color: "#6b7280", fontSize: 12 }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
        {countries.map((c, i) => (
          <div key={c.country} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ color: "#374151", fontWeight: 500 }}>{c.country}</span>
            </div>
            <span style={{ color: "#111827", fontWeight: 600 }}>{fmtEur(c.spend)}</span>
            <span style={{ color: "#9ca3af" }}>ROAS {c.roas.toFixed(2)}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const card  = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" };
const title = { fontSize: 13, fontWeight: 600, color: "#374151" };
const sub   = { fontSize: 12, color: "#9ca3af", marginTop: 2, marginBottom: 16 };
