import { useEffect, useRef, useState } from "react";
import api from "../utils/api";

export default function NetworkGraph() {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cyLoaded, setCyLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Cytoscape
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.29.2/cytoscape.min.js";
    script.onload = () => setCyLoaded(true);
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  useEffect(() => {
    api.get("/api/graph/").then(r => setGraphData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cyLoaded || !graphData || !containerRef.current) return;
    const Cytoscape = window.cytoscape;

    const riskColor = (score) => {
      if (score >= 0.75) return "#ef4444";
      if (score >= 0.5) return "#f97316";
      if (score >= 0.25) return "#eab308";
      return "#22c55e";
    };

    const elements = [
      ...graphData.nodes.map(n => ({
        data: { id: n.id, label: n.label, risk_score: n.risk_score, risk_level: n.risk_level, in_degree: n.in_degree, out_degree: n.out_degree, total_volume: n.total_volume },
      })),
      ...graphData.edges.map(e => ({
        data: { id: `${e.source}-${e.target}-${Math.random()}`, source: e.source, target: e.target, amount: e.amount, transaction_id: e.transaction_id },
      })),
    ];

    if (cyRef.current) cyRef.current.destroy();

    cyRef.current = Cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele) => riskColor(ele.data("risk_score")),
            "border-color": (ele) => riskColor(ele.data("risk_score")),
            "border-width": 2,
            "border-opacity": 0.8,
            label: "data(label)",
            color: "#e2e8f0",
            "font-size": "10px",
            "font-family": "'IBM Plex Mono', monospace",
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: (ele) => Math.max(20, 15 + ele.data("risk_score") * 30),
            height: (ele) => Math.max(20, 15 + ele.data("risk_score") * 30),
            "background-opacity": 0.85,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#1e3a5f",
            "target-arrow-color": "#1e3a5f",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.6,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#60a5fa",
            "border-width": 3,
            "background-opacity": 1,
          },
        },
      ],
      layout: { name: "cose", idealEdgeLength: 100, nodeOverlap: 20, animate: false },
      backgroundColor: "#0a0e17",
    });

    cyRef.current.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelected({
        id: node.id(),
        ...node.data(),
      });
    });

    cyRef.current.on("tap", (evt) => {
      if (evt.target === cyRef.current) setSelected(null);
    });

    return () => { if (cyRef.current) cyRef.current.destroy(); };
  }, [cyLoaded, graphData]);

  const riskColor = (score) => score >= 0.75 ? "#ef4444" : score >= 0.5 ? "#f97316" : score >= 0.25 ? "#eab308" : "#22c55e";

  const s = {
    page: { padding: "28px 32px", fontFamily: "'IBM Plex Mono', monospace", height: "calc(100vh - 0px)", display: "flex", flexDirection: "column" },
    title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 },
    sub: { fontSize: 12, color: "#4b5e7a", marginBottom: 16 },
    graphArea: { flex: 1, display: "flex", gap: 16, minHeight: 0 },
    container: { flex: 1, background: "#0a0e17", border: "1px solid #1e2d4a", borderRadius: 8, position: "relative" },
    sidebar: { width: 220, background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16, overflowY: "auto" },
    legend: { marginBottom: 16 },
    legendItem: (color) => ({ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12 }),
    dot: (color) => ({ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }),
  };

  return (
    <div style={s.page}>
      <div style={s.title}>◎ NETWORK GRAPH</div>
      <div style={s.sub}>
        {graphData ? `${graphData.nodes?.length || 0} accounts · ${graphData.edges?.length || 0} transactions` : "Loading..."}
      </div>

      <div style={s.graphArea}>
        <div style={s.container}>
          {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5e7a" }}>Loading graph data...</div>}
          {!loading && graphData?.nodes?.length === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5e7a", flexDirection: "column", gap: 8 }}><div style={{ fontSize: 32 }}>◎</div><div>No data — upload transactions first</div></div>}
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        <div style={s.sidebar}>
          <div style={{ fontSize: 11, color: "#4b5e7a", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Legend</div>
          <div style={s.legend}>
            {[["#ef4444", "Critical (≥75%)"], ["#f97316", "High (≥50%)"], ["#eab308", "Medium (≥25%)"], ["#22c55e", "Low (<25%)"]].map(([color, label]) => (
              <div key={color} style={s.legendItem(color)}>
                <div style={s.dot(color)} />
                <span style={{ color: "#64748b", fontSize: 11 }}>{label}</span>
              </div>
            ))}
          </div>

          {selected && (
            <>
              <div style={{ fontSize: 11, color: "#4b5e7a", marginBottom: 10, marginTop: 16, borderTop: "1px solid #1e2d4a", paddingTop: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Selected Node</div>
              <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, marginBottom: 8, wordBreak: "break-all" }}>{selected.id}</div>
              {[
                ["Risk Level", selected.risk_level, riskColor(selected.risk_score)],
                ["Risk Score", `${((selected.risk_score || 0) * 100).toFixed(1)}%`, riskColor(selected.risk_score)],
                ["Incoming Tx", selected.in_degree, "#94a3b8"],
                ["Outgoing Tx", selected.out_degree, "#94a3b8"],
                ["Total Volume", `$${(selected.total_volume || 0).toLocaleString()}`, "#94a3b8"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #0a0e17", fontSize: 11 }}>
                  <span style={{ color: "#4b5e7a" }}>{label}</span>
                  <span style={{ color }}>{val}</span>
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop: 16, fontSize: 10, color: "#4b5e7a", lineHeight: 1.6 }}>
            <div>Click node to inspect</div>
            <div>Scroll to zoom</div>
            <div>Drag to pan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
