import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Cell,
} from "recharts";
import api from "../utils/api";

const COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const S = {
  page: { padding: "28px 32px", fontFamily: "'IBM Plex Mono', monospace", color: "#e2e8f0" },
  title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.05em" },
  sub: { fontSize: 12, color: "#4b5e7a", marginTop: 4, marginBottom: 28 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 24 },
  grid5: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 },
  panel: {
    background: "#0d1220", border: "1px solid #1e2d4a",
    borderRadius: 8, padding: 20,
  },
  panelTitle: {
    fontSize: 11, color: "#4b5e7a", textTransform: "uppercase",
    letterSpacing: "0.1em", marginBottom: 16,
  },
  metricCard: (accent) => ({
    background: "#0d1220", border: `1px solid ${accent}33`,
    borderRadius: 8, padding: "18px 16px", textAlign: "center",
  }),
  metricVal: (accent) => ({
    fontSize: 30, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums",
  }),
  metricLabel: { fontSize: 11, color: "#64748b", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" },
  confRow: { display: "flex", gap: 12 },
  confCell: (bg, border) => ({
    flex: 1, background: bg, border: `1px solid ${border}`,
    borderRadius: 6, padding: "16px 12px", textAlign: "center",
  }),
  confVal: { fontSize: 28, fontWeight: 700 },
  confLabel: { fontSize: 10, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" },
  barLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 4 },
  barTrack: { background: "#1e2d4a", borderRadius: 4, height: 10, overflow: "hidden" },
  barFill: (pct, color) => ({
    width: `${Math.min(pct * 100, 100)}%`, height: "100%",
    background: color, borderRadius: 4, transition: "width 0.6s ease",
  }),
  tag: (color) => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 3,
    fontSize: 10, fontWeight: 600,
    background: `${color}22`, color, border: `1px solid ${color}44`,
  }),
};

function MetricGauge({ label, value, color, format = "pct" }) {
  const display = format === "pct"
    ? `${(value * 100).toFixed(1)}%`
    : value.toFixed(4);
  return (
    <div style={S.metricCard(color)}>
      <div style={S.metricVal(color)}>{display}</div>
      <div style={S.metricLabel}>{label}</div>
      <div style={{ marginTop: 12 }}>
        <div style={S.barTrack}>
          <div style={S.barFill(value, color)} />
        </div>
      </div>
    </div>
  );
}

function ConfusionMatrix({ stats }) {
  const { true_positives: tp, false_positives: fp, true_negatives: tn, false_negatives: fn } = stats;
  return (
    <div>
      <div style={{ fontSize: 11, color: "#4b5e7a", marginBottom: 8, textAlign: "center" }}>
        Predicted →
      </div>
      <div style={{ ...S.confRow, marginBottom: 8 }}>
        <div style={S.confCell("#0d220d", "#166534")}>
          <div style={{ ...S.confVal, color: "#22c55e" }}>{tp}</div>
          <div style={S.confLabel}>True Positive</div>
        </div>
        <div style={S.confCell("#1a0d0d", "#7f1d1d")}>
          <div style={{ ...S.confVal, color: "#ef4444" }}>{fp}</div>
          <div style={S.confLabel}>False Positive</div>
        </div>
      </div>
      <div style={S.confRow}>
        <div style={S.confCell("#1a0d0d", "#7f1d1d")}>
          <div style={{ ...S.confVal, color: "#f97316" }}>{fn}</div>
          <div style={S.confLabel}>False Negative</div>
        </div>
        <div style={S.confCell("#0d220d", "#166534")}>
          <div style={{ ...S.confVal, color: "#22c55e" }}>{tn}</div>
          <div style={S.confLabel}>True Negative</div>
        </div>
      </div>
    </div>
  );
}

const EMPTY = {
  model_performance: { precision: 0, recall: 0, f1_score: 0, accuracy: 0, auc_roc: 0 },
  detection_stats: { true_positives: 0, false_positives: 0, true_negatives: 0, false_negatives: 0 },
  risk_distribution: { critical: 0, high: 0, medium: 0, low: 0 },
  pattern_breakdown: {},
  score_histogram: [],
  total_transactions: 0,
};

export default function EvalMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/metrics/summary")
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ ...S.page, color: "#4b5e7a" }}>Loading metrics...</div>;

  const d = data || EMPTY;
  const mp = d.model_performance;
  const ds = d.detection_stats;
  const rd = d.risk_distribution;
  const pb = d.pattern_breakdown || {};
  const hist = d.score_histogram || [];

  const radarData = [
    { metric: "Precision", value: mp.precision },
    { metric: "Recall", value: mp.recall },
    { metric: "F1 Score", value: mp.f1_score },
    { metric: "Accuracy", value: mp.accuracy },
    { metric: "AUC-ROC", value: mp.auc_roc },
  ];

  const riskRows = [
    { label: "Critical (≥0.75)", count: rd.critical, color: COLORS.critical },
    { label: "High (0.50–0.75)", count: rd.high, color: COLORS.high },
    { label: "Medium (0.25–0.50)", count: rd.medium, color: COLORS.medium },
    { label: "Low (<0.25)", count: rd.low, color: COLORS.low },
  ];
  const riskTotal = rd.critical + rd.high + rd.medium + rd.low || 1;

  const patternRows = Object.entries({
    circular_transaction: "Circular Transaction",
    pass_through_account: "Pass-Through Account",
    high_connectivity: "High Connectivity",
    unusually_large_amount: "Unusually Large Amount",
    ...pb,
  }).map(([k, v]) => ({
    pattern: typeof v === "string" ? v : k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    count: typeof v === "number" ? v : (pb[k] || 0),
  })).filter(r => typeof r.count === "number");

  // Histogram bar colors by bucket index
  const histColor = (i) => i >= 7 ? "#ef4444" : i >= 5 ? "#f97316" : i >= 3 ? "#eab308" : "#3b82f6";

  return (
    <div style={S.page}>
      <div>
        <div style={S.title}>◈ Evaluation Metrics</div>
        <div style={S.sub}>
          GNN model performance · {d.total_transactions.toLocaleString()} transactions analyzed
          {error && <span style={{ color: "#ef4444", marginLeft: 12 }}>⚠ {error}</span>}
        </div>
      </div>

      {/* Model Performance KPIs */}
      <div style={S.grid5}>
        <MetricGauge label="Precision" value={mp.precision} color="#3b82f6" />
        <MetricGauge label="Recall" value={mp.recall} color="#a855f7" />
        <MetricGauge label="F1 Score" value={mp.f1_score} color="#06b6d4" />
        <MetricGauge label="Accuracy" value={mp.accuracy} color="#22c55e" />
        <MetricGauge label="AUC-ROC" value={mp.auc_roc} color="#f97316" />
      </div>

      {/* Radar + Confusion Matrix */}
      <div style={S.grid2}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Performance Radar</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e2d4a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11 }} />
              <Radar
                name="Score" dataKey="value" stroke="#3b82f6"
                fill="#3b82f6" fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.panel}>
          <div style={S.panelTitle}>Confusion Matrix</div>
          <ConfusionMatrix stats={ds} />
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: `TP ${ds.true_positives}`, color: "#22c55e" },
              { label: `FP ${ds.false_positives}`, color: "#ef4444" },
              { label: `FN ${ds.false_negatives}`, color: "#f97316" },
              { label: `TN ${ds.true_negatives}`, color: "#22c55e" },
            ].map(({ label, color }) => (
              <span key={label} style={S.tag(color)}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Score Histogram + Risk Distribution */}
      <div style={S.grid2}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Risk Score Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hist} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <XAxis dataKey="bucket" tick={{ fill: "#4b5e7a", fontSize: 9 }} />
              <YAxis tick={{ fill: "#4b5e7a", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {hist.map((_, i) => <Cell key={i} fill={histColor(i)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.panel}>
          <div style={S.panelTitle}>Risk Tier Breakdown</div>
          {riskRows.map(({ label, count, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ ...S.barLabel, color: color }}>{label}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{count} ({((count / riskTotal) * 100).toFixed(1)}%)</span>
              </div>
              <div style={S.barTrack}>
                <div style={S.barFill(count / riskTotal, color)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern Breakdown */}
      {patternRows.length > 0 && (
        <div style={S.panel}>
          <div style={S.panelTitle}>Detected Pattern Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={patternRows} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: "#4b5e7a", fontSize: 10 }} />
              <YAxis type="category" dataKey="pattern" tick={{ fill: "#94a3b8", fontSize: 11 }} width={180} />
              <Tooltip
                contentStyle={{ background: "#0d1220", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metric Definitions */}
      <div style={{ ...S.panel, marginTop: 24 }}>
        <div style={S.panelTitle}>Metric Definitions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
          {[
            { term: "Precision", def: "Of all flagged transactions, what fraction are truly suspicious. High precision = fewer false alarms." },
            { term: "Recall", def: "Of all truly suspicious transactions, what fraction were caught. High recall = fewer missed threats." },
            { term: "F1 Score", def: "Harmonic mean of Precision & Recall. Balances both concerns into a single number." },
            { term: "Accuracy", def: "Overall fraction of transactions classified correctly." },
            { term: "AUC-ROC", def: "Area under the ROC curve — model's ability to distinguish suspicious from normal. 1.0 is perfect." },
          ].map(({ term, def }) => (
            <div key={term} style={{ background: "#060c18", borderRadius: 6, padding: "12px 14px", border: "1px solid #1e2d4a" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>{term}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{def}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
