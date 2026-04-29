/* global React, DCS_DATA, DCS_LIB */
const { useState, useMemo, useEffect } = React;

// ---------- Sidebar ----------
function Sidebar({ current, onNav, role, onRoleChange, variant }) {
  const { Icon } = window.DCS_LIB;
  const items = [
    { key: "home", label: "Dashboard", icon: "home" },
    { key: "projects", label: "Projects", icon: "folder", badge: 9 },
    { key: "my-projects", label: "My Projects", icon: "user", badge: 3 },
    { key: "workload", label: "Workload", icon: "workload" },
    { key: "analytics", label: "Analytics", icon: "chart" },
  ];
  const adminItems = [
    { key: "admin", label: "Master Data", icon: "cog" },
  ];
  return React.createElement("aside", { className: "sidebar" },
    React.createElement("div", { className: "sidebar-brand" },
      React.createElement("div", { className: "sidebar-brand-mark" }, "D"),
      React.createElement("div", null,
        React.createElement("div", { className: "sidebar-brand-text" }, "DCS Tracker"),
        React.createElement("div", { className: "sidebar-brand-sub" }, variant === "console" ? "OPS // v2.4" : "Spring 2026")
      )
    ),
    React.createElement("div", { className: "sidebar-section-label" }, "Workspace"),
    items.map(it =>
      React.createElement("button", {
        key: it.key,
        className: `nav-item ${current === it.key ? "active" : ""}`,
        onClick: () => onNav(it.key),
      },
        React.createElement(Icon, { name: it.icon }),
        React.createElement("span", null, it.label),
        it.badge && React.createElement("span", { className: "badge" }, it.badge)
      )
    ),
    role === "Admin" && [
      React.createElement("div", { key: "lbl", className: "sidebar-section-label" }, "Admin"),
      ...adminItems.map(it =>
        React.createElement("button", {
          key: it.key,
          className: `nav-item ${current === it.key ? "active" : ""}`,
          onClick: () => onNav(it.key),
        },
          React.createElement(Icon, { name: it.icon }),
          React.createElement("span", null, it.label)
        )
      ),
    ],
    React.createElement("div", { style: { marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--line)" } },
      React.createElement("div", { className: "sidebar-section-label", style: { paddingTop: 4 } }, "Viewing as"),
      ["Admin", "Instructional Designer", "Digital Content Specialist"].map(r =>
        React.createElement("button", {
          key: r,
          className: `nav-item ${role === r ? "active" : ""}`,
          onClick: () => onRoleChange(r),
          style: { fontSize: 12.5 },
        },
          React.createElement("span", { className: `role-chip role-${window.DCS_LIB.slugify(r)}`, style: { padding: "1px 6px" } }, r.split(" ").map(w => w[0]).join("")),
          React.createElement("span", null, r === "Digital Content Specialist" ? "DCS / Editor" : r.split(" ")[0] === "Instructional" ? "Instr. Designer" : r)
        )
      )
    )
  );
}

// ---------- Topbar ----------
function Topbar({ title, subtitle, action, role }) {
  const { Icon } = window.DCS_LIB;
  return React.createElement("header", { className: "topbar" },
    React.createElement("div", null,
      React.createElement("div", { className: "topbar-title" }, title),
      subtitle && React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)" } }, subtitle)
    ),
    React.createElement("div", { className: "topbar-spacer" }),
    React.createElement("button", { className: "btn btn-ghost btn-icon" }, React.createElement(Icon, { name: "search", size: 16 })),
    React.createElement("button", { className: "btn btn-ghost btn-icon" }, React.createElement(Icon, { name: "bell", size: 16 })),
    action,
    React.createElement("div", { className: "avatar avatar-Admin", style: { width: 30, height: 30 } }, role === "Admin" ? "AP" : role === "Instructional Designer" ? "LH" : "DP")
  );
}

window.DCS_CHROME = { Sidebar, Topbar };
