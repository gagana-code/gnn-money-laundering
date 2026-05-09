import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Transactions() {
  const [data, setData] = useState({ transactions: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, sort_by: sortBy };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/transactions/", { params });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, search, statusFilter, sortBy]);

  const riskColor = (score) => score >= 0.75 ? "#ef4444" : score >= 0.5 ? "#f97316" : score >= 0.25 ? "#eab308" : "#22c55e";
  const riskBg = (score) => score >= 0.75 ? "#450a0a" : score >= 0.5 ? "#431407" : score >= 0.25 ? "#422006" : "#052e16";

  const s = {
    page: { padding: "28px 32px", fontFamily: "'IBM Plex Mono', monospace" },
    title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 },
    controls: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" },
    input: { padding: "8px 12px", background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 4, color: "#e2e8f0", fontSize: 12, fontFamily: "inherit", minWidth: 200 },
    select: { padding: "8px 12px", background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 4, color: "#e2e8f0", fontSize: 12, fontFamily: "inherit" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12, background: "#0d1220", borderRadius: 8, overflow: "hidden" },
    th: { padding: "10px 14px", textAlign: "left", color: "#4b5e7a", borderBottom: "1px solid #1e2d4a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", background: "#0a0e17" },
    td: { padding: "10px 14px", borderBottom: "1px solid #0a0e17", color: "#94a3b8", verticalAlign: "middle" },
    badge: (status) => ({ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: status === "Suspicious" ? "#450a0a" : "#052e16", color: status === "Suspicious" ? "#fca5a5" : "#86efac" }),
    pagination: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 },
    pgBtn: (active) => ({ padding: "6px 14px", background: active ? "#1d4ed8" : "#0d1220", border: `1px solid ${active ? "#1d4ed8" : "#1e2d4a"}`, borderRadius: 4, color: active ? "white" : "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }),
  };

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={s.title}>⇄ TRANSACTIONS</div>
        <div style={{ fontSize: 12, color: "#4b5e7a" }}>{data.total} total records</div>
      </div>

      <div style={s.controls}>
        <input style={s.input} placeholder="Search sender, receiver, TX ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={s.select} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Normal">Normal</option>
          <option value="Suspicious">Suspicious</option>
        </select>
        <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="risk_score">Sort: Risk Score</option>
          <option value="amount">Sort: Amount</option>
          <option value="timestamp">Sort: Date</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: "#4b5e7a", padding: 32, textAlign: "center" }}>Loading...</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>{["TX ID", "Sender", "Receiver", "Amount", "Timestamp", "Risk Score", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.transactions.map((t, i) => (
                  <tr key={i} style={{ background: t.status === "Suspicious" ? "#1a0a0a" : "transparent" }}>
                    <td style={s.td}><span style={{ color: "#60a5fa" }}>{t.transaction_id?.slice(0, 12)}...</span></td>
                    <td style={s.td}>{t.sender}</td>
                    <td style={s.td}>{t.receiver}</td>
                    <td style={{ ...s.td, color: "#e2e8f0", fontWeight: 600 }}>${t.amount?.toLocaleString()}</td>
                    <td style={s.td}>{t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: "#1e2d4a", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${(t.risk_score || 0) * 100}%`, height: "100%", background: riskColor(t.risk_score), borderRadius: 2 }} />
                        </div>
                        <span style={{ color: riskColor(t.risk_score), fontSize: 11 }}>{((t.risk_score || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.badge(t.status)}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={s.pagination}>
            {[...Array(Math.ceil(data.total / 50))].slice(0, 10).map((_, i) => (
              <button key={i} style={s.pgBtn(page === i + 1)} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
