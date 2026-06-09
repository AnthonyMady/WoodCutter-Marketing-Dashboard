export default function KpiCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#1e2130",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      minWidth: 160,
    }}>
      <span style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#64748b" }}>{sub}</span>}
    </div>
  );
}
