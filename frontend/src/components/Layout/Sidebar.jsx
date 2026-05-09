import { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "⊞", label: "Dashboard" },
  { to: "/upload", icon: "↑", label: "Upload Data" },
  { to: "/transactions", icon: "⇄", label: "Transactions" },
  { to: "/alerts", icon: "⚠", label: "Alerts" },
  { to: "/graph", icon: "◎", label: "Network Graph" },
  { to: "/metrics", icon: "◈", label: "Eval Metrics" },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'IBM Plex Mono', monospace", background: "#0a0e17", color: "#e2e8f0" }}>
      <aside style={{
        width: collapsed ? "64px" : "220px",
        background: "#0d1220",
        borderRight: "1px solid #1e2d4a",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #1e2d4a", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, color: "#3b82f6" }}>◈</span>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 14, color: "#60a5fa", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>AML SHIELD</span>}
          <span onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: "auto", cursor: "pointer", color: "#4b5e7a", fontSize: 16 }}>{collapsed ? "▷" : "◁"}</span>
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px",
              textDecoration: "none",
              fontSize: 13,
              color: isActive ? "#60a5fa" : "#64748b",
              background: isActive ? "#1e2d4a22" : "transparent",
              borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            })}>
              <span style={{ fontSize: 16, minWidth: 20, textAlign: "center" }}>{icon}</span>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2d4a" }}>
          {!collapsed && <div style={{ fontSize: 11, color: "#4b5e7a" }}>AML Detection System</div>}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", background: "#0a0e17" }}>
        {children}
      </main>
    </div>
  );
}
