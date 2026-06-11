const fmt = (v, type) => {
  const n = parseFloat(v);
  if (isNaN(n)) return v || "—";
  if (type === "currency") return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (type === "percent")  return `${(n * 100).toFixed(2)}%`;
  if (type === "number")   return n.toLocaleString();
  return v;
};

export default function PerformanceTable({ title, rows, columns }) {
  return (
    <div style={{ background: "#1e2130", borderRadius: 12, padding: "24px 20px", overflowX: "auto" }}>
      <h3 style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: "left", color: "#64748b", fontWeight: 500, paddingBottom: 10, borderBottom: "1px solid #2d3348" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #1a1f2e" }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "8px 0", color: "#e2e8f0" }}>
                  {fmt(row[c.key], c.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
