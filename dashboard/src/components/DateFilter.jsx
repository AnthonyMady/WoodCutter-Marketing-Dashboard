import { useState, useRef, useEffect } from "react";

const PRESETS = [
  { key: "7d",     label: "7d" },
  { key: "30d",    label: "30d" },
  { key: "90d",    label: "90d" },
  { key: "ytd",    label: "YTD" },
  { key: "all",    label: "All" },
  { key: "custom", label: "Custom" },
];

export default function DateFilter({ value, onChange, customRange, onCustomRange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [localStart, setLocalStart] = useState(customRange?.start ?? "");
  const [localEnd,   setLocalEnd]   = useState(customRange?.end   ?? "");
  const ref = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleApply = () => {
    if (!localStart || !localEnd) return;
    onCustomRange({ start: localStart, end: localEnd });
    onChange("custom");
    setShowPicker(false);
  };

  const customLabel = value === "custom" && customRange?.start
    ? `${customRange.start.slice(5)} → ${customRange.end.slice(5)}`
    : "Custom";

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div style={{ display: "flex", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              if (p.key === "custom") { setShowPicker((s) => !s); }
              else { setShowPicker(false); onChange(p.key); }
            }}
            style={{
              padding: "7px 14px",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              background: value === p.key ? "#2563eb" : "transparent",
              color:      value === p.key ? "#fff"    : "#6b7280",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {p.key === "custom" ? customLabel : p.label}
          </button>
        ))}
      </div>

      {showPicker && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          padding: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", minWidth: 260,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            Custom date range
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>
              From
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                style={{
                  display: "block", marginTop: 4, width: "100%",
                  border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px",
                  fontSize: 13, color: "#111827", outline: "none", background: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>
              To
              <input
                type="date"
                value={localEnd}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setLocalEnd(e.target.value)}
                style={{
                  display: "block", marginTop: 4, width: "100%",
                  border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px",
                  fontSize: 13, color: "#111827", outline: "none", background: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </label>
          </div>
          <button
            onClick={handleApply}
            disabled={!localStart || !localEnd || localStart > localEnd}
            style={{
              width: "100%", padding: "8px 0", background: "#2563eb", color: "#fff",
              border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: (!localStart || !localEnd || localStart > localEnd) ? 0.4 : 1,
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
