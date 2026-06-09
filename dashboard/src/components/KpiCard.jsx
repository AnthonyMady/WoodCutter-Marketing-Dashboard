export default function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#1a1d2e",
      border: `1px solid ${accent ?? "#2d3348"}`,
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      flex: "1 1 160px",
    }}>
      <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#64748b" }}>{sub}</span>}
    </div>
  );
}
