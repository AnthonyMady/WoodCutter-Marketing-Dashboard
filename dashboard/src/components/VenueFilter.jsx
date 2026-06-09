import { VENUES } from "../lib/data.js";

const FLAG = {
  "Brussels":         "🇧🇪",
  "Antwerp":          "🇧🇪",
  "Berlin":           "🇩🇪",
  "Frankfurt":        "🇩🇪",
  "Hamburg":          "🇩🇪",
  "Cologne":          "🇩🇪",
  "Bonn":             "🇩🇪",
  "Leipzig":          "🇩🇪",
  "Shooters Brussels":"🇧🇪",
  "All venues":       "🌍",
};

export default function VenueFilter({ value, onChange }) {
  return (
    <div style={{ background: "#1a1d2e", borderRadius: 12, padding: "16px 20px" }}>
      <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 12 }}>
        Venue
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {VENUES.map((v) => {
          const active = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: active ? "1px solid #4f8ef7" : "1px solid #22263a",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                background: active ? "#4f8ef722" : "#0d0f1a",
                color: active ? "#4f8ef7" : "#94a3b8",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
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
