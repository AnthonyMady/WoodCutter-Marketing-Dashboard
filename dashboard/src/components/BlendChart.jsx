import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmt = (v) => `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function BlendChart({ data }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Daily Spend & Conversions</p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Google Ads + Meta Ads · stacked</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false}
            tickFormatter={(d) => d.slice(5)} />
          <YAxis yAxisId="spend" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false}
            axisLine={false} tickFormatter={fmt} />
          <YAxis yAxisId="conv" orientation="right" tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
            labelStyle={{ color: "#111827", fontWeight: 600, marginBottom: 4 }}
            formatter={(v, name) => {
              if (name === "Google Ads" || name === "Meta Ads") return [fmt(v), name];
              return [Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }), name];
            }}
          />
          <Legend wrapperStyle={{ color: "#6b7280", fontSize: 12 }} />
          <Bar yAxisId="spend" dataKey="gSpend" name="Google Ads" stackId="spend"
            fill="#2563eb" radius={[0,0,0,0]} />
          <Bar yAxisId="spend" dataKey="mSpend" name="Meta Ads" stackId="spend"
            fill="#93c5fd" radius={[3,3,0,0]} />
          <Line yAxisId="conv" type="monotone" dataKey="conversions" name="Conversions"
            stroke="#16a34a" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
