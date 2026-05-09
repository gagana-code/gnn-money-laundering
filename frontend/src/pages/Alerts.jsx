import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Alerts() {
  const [data, setData] = useState({ alerts: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Open");
  const [levelFilter, setLevelFilter] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (levelFilter) params.risk_level = levelFilter;
      const res = await api.get("/api/alerts/", { params });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [statusFilter, levelFilter]);

  const resolveAlert = async (alertId) => {
    try {
      await api.patch(`/api/alerts/${alertId}/resolve`);
      fetchAlerts();
    } catch (e) { console.error(e); }
  };

  const levelColor = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };
  const levelBg = { Critical: "#450a0a", High: "#431407", Medium: "#422006", Low: "#052e16" };

  const s = {
    page: { padding: "28px 32px", fontFamily: "'IBM Plex Mono', monospace" },
    title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 },
    controls: { display: "flex", gap: 12, marginBottom: 20 },
    select: { padding: "8px 12px", background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 4, color: "#e2e8f0", fontSize: 12, fontFamily: "inherit" },
    card: (level) => ({ background: "#0d1220", border: `1px solid ${levelBg[level] || "#1e2d4a"}`, borderLeft: `3px solid ${levelColor[level] || "#4b5e7a"}`, borderRadius: 6, padding: "16px 20px", marginBottom: 12 }),
    badge: (level) => ({ padding: "3px 10px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: levelBg[level] || "#1e2d4a", color: levelColor[level] || "#64748b" }),
    resolveBtn: { padding: "5px 14px", background: "#052e16", border: "1px solid #166534", borderRadius: 3, color: "#22c55e", cursor: "pointer", fontSize: 11, fontFamily: "inherit" },
  };

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={s.title}>⚠ ALERTS</div>
        <div style={{ fontSize: 12, color: "#ef4444" }}>{data.alerts.filter(a => a.status === "Open").length} open alerts</div>
      </div>

      <div style={s.controls}>
        <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <select style={s.select} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: "#4b5e7a", padding: 32 }}>Loading alerts...</div>
      ) : data.alerts.length === 0 ? (
        <div style={{ color: "#4b5e7a", padding: 32, textAlign: "center", border: "1px dashed #1e2d4a", borderRadius: 8 }}>No alerts found</div>
      ) : (
        data.alerts.map((alert) => (
          <div key={alert.alert_id} style={s.card(alert.risk_level)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700 }}>#{alert.alert_id}</span>
                <span style={s.badge(alert.risk_level)}>{alert.risk_level}</span>
                <span style={{ padding: "3px 10px", borderRadius: 3, fontSize: 10, background: alert.status === "Open" ? "#422006" : "#1e2d4a", color: alert.status === "Open" ? "#fb923c" : "#64748b" }}>{alert.status}</span>
              </div>
              {alert.status === "Open" && (
                <button style={s.resolveBtn} onClick={() => resolveAlert(alert.alert_id)}>✓ Resolve</button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 12 }}>
              {[
                ["Entity", alert.entity],
                ["TX ID", alert.transaction_id?.slice(0, 16) + "..."],
                ["Risk Score", `${((alert.risk_score || 0) * 100).toFixed(1)}%`],
                ["Detected", new Date(alert.created_at).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#4b5e7a" }}>{k}:</span>
                  <span style={{ color: "#94a3b8" }}>{v}</span>
                </div>
              ))}
            </div>
            {alert.reason && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
                Pattern: {alert.reason.split(",").map(r => <span key={r} style={{ padding: "2px 8px", background: "#1e2d4a", borderRadius: 3, marginRight: 4, display: "inline-block" }}>{r.trim()}</span>)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
