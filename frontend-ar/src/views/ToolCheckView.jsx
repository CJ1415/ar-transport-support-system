import { useState, useRef, useEffect } from "react";
// Import your local reference image here
import toolboxRefImage from '../assets/ToolBoxFull.png';

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  misplaced: { border: "#eab308", bg: "#eab30822", label: "#eab308", text: "#000" },
  missing:   { border: "#ef4444", bg: "#ef444422", label: "#ef4444", text: "#fff" },
};
function statusColor(s) { return STATUS_COLORS[s?.toLowerCase()] || STATUS_COLORS.missing; }

// ── Tool Overlay ──────────────────────────────────────────────────────────────
function ToolOverlay({ imageSrc, issues, isScanning }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <img
        src={imageSrc}
        alt="Tool inspection target"
        style={{ display: "block", maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
      />

      {isScanning && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
          background: "rgba(255,180,0,0.04)", animation: "tcPulse 1s infinite",
        }}>
          <div style={{
            position: "absolute", left: 0, right: 0, height: 3,
            background: "linear-gradient(to right, transparent, #f59e0b, transparent)",
            animation: "tcScanline 1.5s linear infinite",
          }} />
        </div>
      )}

      {!isScanning && issues.map((issue, i) => {
        const c = statusColor(issue.status);
        const isMissing = issue.status === "missing";
        return (
          <div
            key={i}
            onClick={() => setTooltip(tooltip === i ? null : i)}
            style={{
              position: "absolute",
              left: `${issue.xPercent}%`, top: `${issue.yPercent}%`,
              width: `${issue.widthPercent}%`, height: `${issue.heightPercent}%`,
              border: `2px ${isMissing ? "dashed" : "solid"} ${c.border}`,
              backgroundColor: c.bg,
              boxShadow: isMissing ? `0 0 14px ${c.border}99` : "none",
              cursor: "pointer", zIndex: 10, boxSizing: "border-box",
            }}
          >
            <div style={{
              position: "absolute", top: -22, left: 0,
              background: c.label, color: c.text,
              fontSize: 9, fontFamily: "monospace", fontWeight: "bold",
              textTransform: "uppercase", padding: "1px 5px", whiteSpace: "nowrap",
            }}>
              {isMissing ? `✕ MISSING: ${issue.name}` : `⚠ MISPLACED: ${issue.name}`}
            </div>
            {[
              { top: -2, left: -2, borderTop: `2px solid ${c.border}`, borderLeft: `2px solid ${c.border}` },
              { top: -2, right: -2, borderTop: `2px solid ${c.border}`, borderRight: `2px solid ${c.border}` },
              { bottom: -2, left: -2, borderBottom: `2px solid ${c.border}`, borderLeft: `2px solid ${c.border}` },
              { bottom: -2, right: -2, borderBottom: `2px solid ${c.border}`, borderRight: `2px solid ${c.border}` },
            ].map((s, j) => <div key={j} style={{ position: "absolute", width: 8, height: 8, ...s }} />)}
            {tooltip === i && (
              <div style={{
                position: "absolute", top: "100%", left: 0, zIndex: 30,
                background: "#111", border: `1px solid ${c.border}`,
                padding: "8px 10px", minWidth: 200, maxWidth: 260,
                fontFamily: "monospace", fontSize: 11, color: "#ccc", marginTop: 4,
              }}>
                <div style={{ fontWeight: "bold", color: c.border, textTransform: "uppercase", marginBottom: 4 }}>
                  {issue.name}
                </div>
                <div style={{ lineHeight: 1.5 }}>{issue.notes}</div>
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes tcScanline { from { top: 0; } to { top: 100%; } }
        @keyframes tcPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

// ── Main Tool Check View ──────────────────────────────────────────────────────
export default function ToolCheckView({ onBack }) {
  const [imageSrc, setImageSrc]       = useState(null);
  const [refImageSrc, setRefImageSrc] = useState(null);
  const [isScanning, setIsScanning]   = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);

  const fileInputRef = useRef(null);

  // Load the local baseline asset automatically on component mount
  useEffect(() => {
    fetch(toolboxRefImage)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setRefImageSrc(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error("Failed to load reference image from assets:", err));
  }, []);

  const processImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_WIDTH = 1024;
    const COMPRESSION_QUALITY = 0.85;
    const reader = new FileReader();

    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_WIDTH) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_WIDTH) / height);
            height = MAX_WIDTH;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", COMPRESSION_QUALITY);
        setImageSrc(compressedBase64);
        setResult(null);
        setError(null);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleScan = () => {
    if (!imageSrc || !refImageSrc || isScanning) return;

    const extractImageInfo = (src) => {
        const parts = src.split(",");
        const base64 = parts[1];
        let type = "jpeg";
        if (src.includes("png")) type = "png";
        if (src.includes("webp")) type = "webp";
        return { base64, type };
    }

    const currentImg = extractImageInfo(imageSrc);
    const refImg = extractImageInfo(refImageSrc);

    setIsScanning(true);
    setResult(null);
    setError(null);

    // FIXED: Swapped localStorage.getItem to sessionStorage.getItem
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3000/api/faults/toolcheck", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
          imageBase64: currentImg.base64,
          imageType: currentImg.type,
          referenceImageBase64: refImg.base64,
          referenceImageType: refImg.type,
          toolList: [] // Send empty to trigger the reference check on the backend
      }),
    })
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setResult(data); })
      .catch(err => setError(err.message))
      .finally(() => setIsScanning(false));
  };

  const missing   = result?.issues.filter(i => i.status === "missing")   || [];
  const misplaced = result?.issues.filter(i => i.status === "misplaced") || [];
  const allClear  = result && result.issues.length === 0;

  return (
    <div style={{ fontFamily: "monospace", background: "#0a0a0a", color: "#ccc", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #222", paddingBottom: 12, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#f59e0b", letterSpacing: 3, textTransform: "uppercase" }}>
            Tool Check
          </div>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2 }}>VISUAL INVENTORY SCAN SYSTEM</div>
        </div>
        <button onClick={onBack} style={{
          background: "transparent", border: "1px solid #333", color: "#aaa",
          padding: "6px 16px", fontSize: 11, fontFamily: "monospace",
          textTransform: "uppercase", letterSpacing: 2, cursor: "pointer",
        }}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 9, textTransform: "uppercase", letterSpacing: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 12, border: "2px dashed #ef4444" }} />
          <span style={{ color: "#555" }}>Missing from toolbox</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 12, border: "2px solid #eab308" }} />
          <span style={{ color: "#555" }}>Misplaced</span>
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "#111", border: "1px solid #333", color: "#ccc",
            padding: "8px 16px", fontSize: 11, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: 2, cursor: "pointer",
          }}
        >
          Upload Current Toolbox
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={processImageUpload} />

        <button
          onClick={handleScan}
          disabled={!imageSrc || !refImageSrc || isScanning}
          style={{
            background: imageSrc && refImageSrc && !isScanning ? "#f59e0b" : "#1a1a1a",
            border: `1px solid ${imageSrc && refImageSrc && !isScanning ? "#f59e0b" : "#333"}`,
            color: imageSrc && refImageSrc && !isScanning ? "#000" : "#444",
            padding: "8px 24px", fontSize: 11, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: 3, fontWeight: "bold",
            cursor: imageSrc && refImageSrc && !isScanning ? "pointer" : "not-allowed",
          }}
        >
          {isScanning ? "Scanning..." : "Run Tool Check"}
        </button>

        {refImageSrc ? (
          <span style={{ fontSize: 9, color: "#10b981", textTransform: "uppercase", letterSpacing: 1 }}>
            ✓ Baseline Loaded
          </span>
        ) : (
          <span style={{ fontSize: 9, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1 }}>
            Loading Baseline Asset...
          </span>
        )}
      </div>

      {/* Viewport */}
      <div style={{
        border: "1px solid #222", background: "#050505", minHeight: 400,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", padding: 8, marginBottom: 20,
      }}>
        {[
          { top: -1, left: -1, borderTop: "2px solid #f59e0b", borderLeft: "2px solid #f59e0b" },
          { top: -1, right: -1, borderTop: "2px solid #f59e0b", borderRight: "2px solid #f59e0b" },
          { bottom: -1, left: -1, borderBottom: "2px solid #f59e0b", borderLeft: "2px solid #f59e0b" },
          { bottom: -1, right: -1, borderBottom: "2px solid #f59e0b", borderRight: "2px solid #f59e0b" },
        ].map((s, i) => <div key={i} style={{ position: "absolute", width: 14, height: 14, ...s }} />)}
        <div style={{
          position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
          background: "#050505", padding: "2px 12px", border: "1px solid #222", borderTop: "none",
          fontSize: 9, color: "#f59e0b", letterSpacing: 3,
        }}>
          TOOL SCAN VIEWPORT
        </div>
        {imageSrc ? (
          <ToolOverlay imageSrc={imageSrc} issues={result?.issues || []} isScanning={isScanning} />
        ) : (
          <div style={{ textAlign: "center", color: "#333" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧰</div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 3 }}>Upload a Toolbox Image to Begin</div>
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
        <div style={{ border: "1px solid #222", background: "#0d0d0d", padding: 16 }}>
          {allClear ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#10b981", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
              ✓ All expected tools accounted for — no issues detected
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, borderBottom: "1px solid #1a1a1a", paddingBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Missing</div>
                  <div style={{ fontSize: 36, fontWeight: "bold", color: "#ef4444" }}>{missing.length}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Misplaced</div>
                  <div style={{ fontSize: 36, fontWeight: "bold", color: "#eab308" }}>{misplaced.length}</div>
                </div>
              </div>

              <p style={{ fontSize: 11, lineHeight: 1.7, color: "#aaa", marginBottom: 16 }}>{result.summary}</p>

              <div style={{ display: "grid", gridTemplateColumns: (missing.length && misplaced.length) ? "1fr 1fr" : "1fr", gap: 16 }}>
                {missing.length > 0 && (
                  <div style={{ border: "1px solid #ef444444", background: "#111", padding: 12 }}>
                    <div style={{ fontSize: 9, color: "#ef4444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                      Missing ({missing.length})
                    </div>
                    {missing.map((item, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#ccc", padding: "6px 0", borderBottom: "1px solid #1a1a1a", display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#ef4444", fontWeight: "bold" }}>✕</span>
                          <span>{item.name}</span>
                        </div>
                        {item.notes && <div style={{ fontSize: 9, color: "#555", paddingLeft: 16 }}>{item.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {misplaced.length > 0 && (
                  <div style={{ border: "1px solid #eab30844", background: "#111", padding: 12 }}>
                    <div style={{ fontSize: 9, color: "#eab308", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                      Misplaced ({misplaced.length})
                    </div>
                    {misplaced.map((item, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#ccc", padding: "6px 0", borderBottom: "1px solid #1a1a1a", display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#eab308", fontWeight: "bold" }}>⚠</span>
                          <span>{item.name}</span>
                        </div>
                        {item.notes && <div style={{ fontSize: 9, color: "#555", paddingLeft: 16 }}>{item.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}