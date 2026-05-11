import { useState, useRef } from "react";

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
  critical: { border: "#ef4444", bg: "#ef444422", label: "#ef4444", text: "#fff" },
  high:     { border: "#f97316", bg: "#f9731622", label: "#f97316", text: "#fff" },
  medium:   { border: "#eab308", bg: "#eab30822", label: "#eab308", text: "#000" },
  low:      { border: "#10b981", bg: "#10b98122", label: "#10b981", text: "#fff" },
};

function severityColor(severity) {
  return SEVERITY_COLORS[severity?.toLowerCase()] || SEVERITY_COLORS.low;
}

function SeverityBadge({ severity }) {
  const c = severityColor(severity);
  return (
    <span style={{
      padding: "2px 8px", fontSize: 10, fontFamily: "monospace",
      fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1,
      border: `1px solid ${c.border}`, backgroundColor: c.label, color: c.text,
    }}>
      {severity}
    </span>
  );
}

// ── AR Overlay ────────────────────────────────────────────────────────────────
function AROverlay({ imageSrc, faults, isScanning }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <img
        src={imageSrc}
        alt="Inspection target"
        style={{ display: "block", maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
      />

      {isScanning && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
          background: "rgba(0,200,180,0.05)", animation: "arPulse 1s infinite",
        }}>
          <div style={{
            position: "absolute", left: 0, right: 0, height: 3,
            background: "linear-gradient(to right, transparent, #00c8b4, transparent)",
            animation: "arScanline 1.5s linear infinite",
          }} />
        </div>
      )}

      {!isScanning && faults.map((fault, i) => {
        const c = severityColor(fault.severity);
        return (
          <div
            key={i}
            onClick={() => setTooltip(tooltip === i ? null : i)}
            style={{
              position: "absolute",
              left: `${fault.xPercent}%`, top: `${fault.yPercent}%`,
              width: `${fault.widthPercent}%`, height: `${fault.heightPercent}%`,
              border: `2px solid ${c.border}`, backgroundColor: c.bg,
              boxShadow: fault.severity === "critical" ? `0 0 10px ${c.border}` : "none",
              cursor: "pointer", zIndex: 10, boxSizing: "border-box",
            }}
          >
            <div style={{
              position: "absolute", top: -22, left: 0,
              background: c.label, color: c.text,
              fontSize: 9, fontFamily: "monospace", fontWeight: "bold",
              textTransform: "uppercase", padding: "1px 5px", whiteSpace: "nowrap",
            }}>
              [{fault.label}]
            </div>

            {[
              { top: -2, left: -2, borderTop: `2px solid ${c.border}`, borderLeft: `2px solid ${c.border}` },
              { top: -2, right: -2, borderTop: `2px solid ${c.border}`, borderRight: `2px solid ${c.border}` },
              { bottom: -2, left: -2, borderBottom: `2px solid ${c.border}`, borderLeft: `2px solid ${c.border}` },
              { bottom: -2, right: -2, borderBottom: `2px solid ${c.border}`, borderRight: `2px solid ${c.border}` },
            ].map((s, j) => (
              <div key={j} style={{ position: "absolute", width: 8, height: 8, ...s }} />
            ))}

            {tooltip === i && (
              <div style={{
                position: "absolute", top: "100%", left: 0, zIndex: 30,
                background: "#111", border: `1px solid ${c.border}`,
                padding: "8px 10px", minWidth: 200, maxWidth: 260,
                fontFamily: "monospace", fontSize: 11, color: "#ccc", marginTop: 4,
              }}>
                <div style={{ fontWeight: "bold", color: c.border, textTransform: "uppercase", marginBottom: 4 }}>
                  {fault.label} <SeverityBadge severity={fault.severity} />
                </div>
                <div style={{ lineHeight: 1.5 }}>{fault.description}</div>
                <div style={{ marginTop: 6, fontSize: 9, color: "#666", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <span>X: {fault.xPercent.toFixed(1)}%</span>
                  <span>Y: {fault.yPercent.toFixed(1)}%</span>
                  <span>W: {fault.widthPercent.toFixed(1)}%</span>
                  <span>H: {fault.heightPercent.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes arScanline { from { top: 0; } to { top: 100%; } }
        @keyframes arPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

// ── Main Scanner View ─────────────────────────────────────────────────────────
export default function ARScannerView({ onBack }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [category, setCategory] = useState("train_track");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = () => {
    if (!imageSrc || isScanning) return;

    const parts = imageSrc.split(",");
    const base64 = parts[1];
    let imageType = "jpeg";
    if (imageSrc.includes("png")) imageType = "png";
    if (imageSrc.includes("webp")) imageType = "webp";

    setIsScanning(true);
    setResult(null);
    setError(null);

    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/faults/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ imageBase64: base64, imageType, category }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResult(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsScanning(false));
  };

  return (
    <div style={{ fontFamily: "monospace", background: "#0a0a0a", color: "#ccc", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #222", paddingBottom: 12, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#00c8b4", letterSpacing: 3, textTransform: "uppercase" }}>
            AR Fault Detector
          </div>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2 }}>STRUCTURAL INSPECTION SYSTEM</div>
        </div>
        <button
          onClick={onBack}
          style={{
            background: "transparent", border: "1px solid #333", color: "#aaa",
            padding: "6px 16px", fontSize: 11, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: 2, cursor: "pointer",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Controls row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, marginBottom: 20, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Inspection Category
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              background: "#111", border: "1px solid #333", color: "#ccc",
              padding: "8px 12px", fontSize: 11, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: 1, width: "100%", outline: "none",
            }}
          >
            <option value="train_track">Train Track</option>
            <option value="train">Train / Carriage</option>
            <option value="wall">Wall / Structure</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Image Source
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#111", border: "1px solid #333", color: "#ccc",
              padding: "8px 16px", fontSize: 11, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: 2, cursor: "pointer",
            }}
          >
            Upload Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileUpload} />
        </div>

        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            &nbsp;
          </div>
          <button
            onClick={handleScan}
            disabled={!imageSrc || isScanning}
            style={{
              background: imageSrc && !isScanning ? "#00c8b4" : "#1a1a1a",
              border: `1px solid ${imageSrc && !isScanning ? "#00c8b4" : "#333"}`,
              color: imageSrc && !isScanning ? "#000" : "#444",
              padding: "8px 24px", fontSize: 11, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: 3, fontWeight: "bold",
              cursor: imageSrc && !isScanning ? "pointer" : "not-allowed",
            }}
          >
            {isScanning ? "Analysing..." : "Initiate Scan"}
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div style={{
        border: "1px solid #222", background: "#050505",
        minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", padding: 8, marginBottom: 20,
      }}>
        {[
          { top: -1, left: -1, borderTop: "2px solid #00c8b4", borderLeft: "2px solid #00c8b4" },
          { top: -1, right: -1, borderTop: "2px solid #00c8b4", borderRight: "2px solid #00c8b4" },
          { bottom: -1, left: -1, borderBottom: "2px solid #00c8b4", borderLeft: "2px solid #00c8b4" },
          { bottom: -1, right: -1, borderBottom: "2px solid #00c8b4", borderRight: "2px solid #00c8b4" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 14, height: 14, ...s }} />
        ))}

        <div style={{
          position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
          background: "#050505", padding: "2px 12px",
          border: "1px solid #222", borderTop: "none",
          fontSize: 9, color: "#00c8b4", letterSpacing: 3,
        }}>
          MAIN VIEWPORT
        </div>

        {imageSrc ? (
          <AROverlay imageSrc={imageSrc} faults={result?.faults || []} isScanning={isScanning} />
        ) : (
          <div style={{ textAlign: "center", color: "#333" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⊕</div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 3 }}>Awaiting Target Data</div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ border: "1px solid #ef4444", background: "#ef444411", color: "#ef4444", padding: "10px 16px", fontSize: 11, marginBottom: 16 }}>
          ERROR: {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ border: "1px solid #222", background: "#0d0d0d", padding: 16, display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          <div style={{ borderRight: "1px solid #1a1a1a", paddingRight: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Overall Status</div>
              <SeverityBadge severity={result.overallSeverity} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Faults Detected</div>
              <div style={{ fontSize: 36, fontWeight: "bold", color: result.faultCount > 0 ? "#ef4444" : "#10b981" }}>
                {result.faultCount}
              </div>
            </div>
            <div style={{ fontSize: 9, color: "#333" }}>Scan ID: {result.scanId}</div>
          </div>

          <div>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, borderBottom: "1px solid #1a1a1a", paddingBottom: 6 }}>
              Analysis Summary
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: "#aaa", marginBottom: 12 }}>{result.summary}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.faults.map((f, i) => {
                const c = severityColor(f.severity);
                return (
                  <div key={i} style={{
                    border: `1px solid ${c.border}`, background: "#111",
                    padding: "3px 8px", fontSize: 9, display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.border, display: "inline-block" }} />
                    <span style={{ textTransform: "uppercase", color: "#ccc" }}>{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
