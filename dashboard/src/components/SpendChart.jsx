import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmt = (v) => `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function SpendChart({ data }) {
  return (
    <div style={{ background: "#1a1d2e", borderRadius: 12, padding: "24px 20px" }}>
      <h3 style={titleStyle}>Daily Spend & Conversions</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#22263a" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false}
            tickFormatter={(d) => d.slice(5)} />
          <YAxis yAxisId="spend" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false}
            axisLine={false} tickFormatter={fmt} />
          <YAxis yAxisId="conv" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#0f1117", border: "1px solid #2d3348", borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
            formatter={(v, name) => {
              if (name === "Spend") return [fmt(v), name];
              return [Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 }), name];
            }}
          />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          <Bar yAxisId="spend" dataKey="spend" name="Spend" fill="#4f8ef7" opacity={0.85} radius={[3,3,0,0]} />
          <Line yAxisId="conv" type="monotone" dataKey="conversions" name="Conversions"
            stroke="#34d399" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const titleStyle = {
  color: "#94a3b8", fontSize: 12, marginBottom: 16,
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
};
