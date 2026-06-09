const PRESETS = [
  { key: "7d",  label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

export default function DateFilter({ value, onChange }) {
  return (
    <div style={{ display: "flex", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            padding: "7px 14px",
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            background: value === p.key ? "#2563eb" : "transparent",
            color:      value === p.key ? "#fff"     : "#6b7280",
            transition: "all 0.15s",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
