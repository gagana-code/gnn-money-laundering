import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "../utils/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setResult(null); setError("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(""); setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/upload/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally { setUploading(false); }
  };

  const s = {
    page: { padding: "28px 32px", fontFamily: "'IBM Plex Mono', monospace", maxWidth: 720 },
    title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 },
    sub: { fontSize: 12, color: "#4b5e7a", marginBottom: 28 },
    dropzone: { border: `2px dashed ${isDragActive ? "#3b82f6" : "#1e2d4a"}`, borderRadius: 8, padding: "48px 32px", textAlign: "center", cursor: "pointer", background: isDragActive ? "#1e2d4a22" : "transparent", transition: "all 0.2s" },
    fileInfo: { background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 6, padding: "16px 20px", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" },
    btn: (disabled) => ({ padding: "12px 28px", background: disabled ? "#1e2d4a" : "#1d4ed8", border: "none", borderRadius: 4, color: disabled ? "#4b5e7a" : "white", fontSize: 13, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.1em", marginTop: 20 }),
    result: { background: "#052e16", border: "1px solid #166534", borderRadius: 6, padding: 20, marginTop: 20 },
    resultRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #166534", fontSize: 13 },
    error: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 4, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginTop: 16 },
  };

  return (
    <div style={s.page}>
      <div style={s.title}>↑ UPLOAD DATA</div>
      <div style={s.sub}>Upload transaction CSV or Excel file for GNN analysis</div>

      <div style={{ background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#4b5e7a", marginBottom: 8 }}>REQUIRED COLUMNS:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["sender", "receiver", "amount"].map(c => <span key={c} style={{ padding: "3px 10px", background: "#1e2d4a", borderRadius: 3, fontSize: 11, color: "#60a5fa" }}>{c}</span>)}
        </div>
        <div style={{ fontSize: 11, color: "#4b5e7a", marginTop: 8 }}>Optional: transaction_id, timestamp</div>
      </div>

      <div {...getRootProps()} style={s.dropzone}>
        <input {...getInputProps()} />
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        {isDragActive
          ? <div style={{ color: "#60a5fa", fontSize: 14 }}>Drop the file here...</div>
          : <div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>Drag & drop your CSV or Excel file</div>
              <div style={{ color: "#4b5e7a", fontSize: 12, marginTop: 6 }}>or click to browse</div>
            </div>}
      </div>

      {file && (
        <div style={s.fileInfo}>
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>📄 {file.name}</div>
            <div style={{ color: "#4b5e7a", fontSize: 11, marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      <button style={s.btn(!file || uploading)} onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "⟳ PROCESSING..." : "⊳ ANALYZE FILE"}
      </button>

      {error && <div style={s.error}>✕ {error}</div>}

      {result && (
        <div style={s.result}>
          <div style={{ color: "#22c55e", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>✓ ANALYSIS COMPLETE</div>
          {[
            ["Total Transactions", result.total_transactions],
            ["Saved to DB", result.saved],
            ["Suspicious Found", result.suspicious],
            ["Alerts Created", result.alerts_created],
            ["Batch ID", result.batch_id],
          ].map(([label, val]) => (
            <div key={label} style={s.resultRow}>
              <span style={{ color: "#64748b" }}>{label}</span>
              <span style={{ color: label === "Suspicious Found" ? "#ef4444" : "#e2e8f0", fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
