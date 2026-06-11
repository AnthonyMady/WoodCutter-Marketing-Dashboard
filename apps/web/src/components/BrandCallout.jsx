export default function BrandCallout({ spend, venue }) {
  if (!spend || spend === 0) return null;
  const fmt = (n) => `€${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={{
      background: "#fffbeb",
      border: "1px solid #fde68a",
      borderLeft: "3px solid #f59e0b",
      borderRadius: 10,
      padding: "11px 16px",
      fontSize: 13,
      color: "#92400e",
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    }}>
      <span>ℹ️</span>
      <span>
        Showing <strong>{venue}</strong>-specific campaigns only.{" "}
        Country-wide brand campaigns ({fmt(spend)} spend) are excluded —
        select <strong>All venues</strong> to include them.
      </span>
    </div>
  );
}
