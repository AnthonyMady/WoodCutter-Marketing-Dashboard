const PRESETS = [
  { key: "7d",  label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All time" },
];

export default function DateFilter({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            background: value === p.key ? "#4f8ef7" : "#1a1d2e",
            color:      value === p.key ? "#fff"     : "#64748b",
            transition: "all 0.15s",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
