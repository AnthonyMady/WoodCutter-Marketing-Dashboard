export default function BrandCallout({ spend, venue }) {
  if (!spend || spend === 0) return null;
  const fmt = (n) => `€${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={{
      background: "#1a1d2e",
      border: "1px solid #2d3348",
      borderLeft: "3px solid #f59e0b",
      borderRadius: 10,
      padding: "12px 16px",
      fontSize: 13,
      color: "#94a3b8",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>ℹ️</span>
      <span>
        Showing <strong style={{ color: "#e2e8f0" }}>{venue}</strong>-specific campaigns only.{" "}
        Country-wide brand campaigns ({fmt(spend)} spend) are excluded here —
        select <strong style={{ color: "#e2e8f0" }}>All venues</strong> to include them.
      </span>
    </div>
  );
}
