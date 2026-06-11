import { VENUES } from "../lib/data.js";

const FLAG = {
  "Brussels":          "🇧🇪",
  "Antwerp":           "🇧🇪",
  "Berlin":            "🇩🇪",
  "Frankfurt":         "🇩🇪",
  "Hamburg":           "🇩🇪",
  "Cologne":           "🇩🇪",
  "Leipzig":           "🇩🇪",
  "Shooters Brussels": "🇧🇪",
  "All venues":        "🌍",
};

export default function VenueFilter({ value, onChange }) {
  const visible = VENUES.filter((v) => v !== "Shooters Brussels");

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Filter by venue
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {visible.map((v) => {
          const active = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                background: active ? "#2563eb" : "#fff",
                color: active ? "#fff" : "#6b7280",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span>{FLAG[v] ?? "📍"}</span>
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
