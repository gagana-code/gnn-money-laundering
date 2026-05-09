import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import api from "../utils/api";

const COLORS = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/stats").then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Total Transactions", value: stats.total_transactions, color: "#3b82f6", icon: "⇄" },
    { label: "Flagged Transactions", value: stats.flagged_transactions, color: "#ef4444", icon: "⚑" },
    { label: "Open Alerts", value: stats.open_alerts, color: "#f97316", icon: "⚠" },
    { label: "High Risk Entities", value: stats.high_risk_entities, color: "#a855f7", icon: "◉" },
    { label: "Total Volume", value: `$${(stats.total_volume || 0).toLocaleString()}`, color: "#22c55e", icon: "$" },
  ] : [];

  const riskData = stats ? [
    { name: "Critical", value: stats.risk_distribution?.critical || 0 },
    { name: "High", value: stats.risk_distribution?.high || 0 },
    { name: "Medium", value: stats.risk_distribution?.medium || 0 },
    { name: "Low", value: stats.risk_distribution?.low || 0 },
  ] : [];

  const styles = {
    page: { padding: "28px 32px", fontFamily: "'IBM Plex Mono', monospace" },
    header: { marginBottom: 28 },
    title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.05em" },
    sub: { fontSize: 12, color: "#4b5e7a", marginTop: 4 },
    cards: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 },
    card: (color) => ({ background: "#0d1220", border: `1px solid ${color}33`, borderRadius: 8, padding: "20px 16px", position: "relative", overflow: "hidden" }),
    cardIcon: (color) => ({ fontSize: 28, color, marginBottom: 8, opacity: 0.8 }),
    cardValue: { fontSize: 28, fontWeight: 700, color: "#e2e8f0" },
    cardLabel: { fontSize: 11, color: "#4b5e7a", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" },
    charts: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 },
    chart: { background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 8, padding: 20 },
    chartTitle: { fontSize: 13, color: "#64748b", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th: { textAlign: "left", padding: "8px 12px", color: "#4b5e7a", borderBottom: "1px solid #1e2d4a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" },
    td: { padding: "10px 12px", borderBottom: "1px solid #0f1829", color: "#94a3b8" },
    badge: (status) => ({ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600, background: status === "Suspicious" ? "#450a0a" : "#052e16", color: status === "Suspicious" ? "#fca5a5" : "#86efac" }),
  };

  if (loading) return <div style={{ ...styles.page, color: "#4b5e7a" }}>Loading dashboard...</div>;
  if (!stats) return <div style={{ ...styles.page, color: "#ef4444" }}>Failed to load dashboard</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>◈ SYSTEM OVERVIEW</div>
        <div style={styles.sub}>Real-time AML monitoring dashboard</div>
      </div>

      <div style={styles.cards}>
        {statCards.map(({ label, value, color, icon }) => (
          <div key={label} style={styles.card(color)}>
            <div style={styles.cardIcon(color)}>{icon}</div>
            <div style={styles.cardValue}>{value}</div>
            <div style={styles.cardLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={styles.charts}>
        <div style={styles.chart}>
          <div style={styles.chartTitle}>Risk Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""} labelLine={false}>
                {riskData.map(({ name }) => <Cell key={name} fill={COLORS[name]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1220", border: "1px solid #1e2d4a", color: "#e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chart}>
          <div style={styles.chartTitle}>Risk Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1220", border: "1px solid #1e2d4a", color: "#e2e8f0", fontSize: 12 }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {riskData.map(({ name }) => <Cell key={name} fill={COLORS[name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chart}>
        <div style={styles.chartTitle}>Recent Transactions</div>
        <table style={styles.table}>
          <thead>
            <tr>{["TX ID", "Sender", "Receiver", "Amount", "Risk Score", "Status"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {(stats.recent_transactions || []).map((t, i) => (
              <tr key={i}>
                <td style={styles.td}>{t.transaction_id?.slice(0, 10)}...</td>
                <td style={styles.td}>{t.sender}</td>
                <td style={styles.td}>{t.receiver}</td>
                <td style={styles.td}>${t.amount?.toLocaleString()}</td>
                <td style={{ ...styles.td, color: t.risk_score >= 0.5 ? "#ef4444" : "#22c55e" }}>{(t.risk_score * 100).toFixed(1)}%</td>
                <td style={styles.td}><span style={styles.badge(t.status)}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
