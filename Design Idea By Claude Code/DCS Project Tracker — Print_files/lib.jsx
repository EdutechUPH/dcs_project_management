/* global React */
const { useState, useMemo, useEffect, useRef, createContext, useContext } = React;

// ---------- Helpers ----------
const slugify = (s) => (s || "").replace(/[\s/]+/g, "-").replace(/[^A-Za-z-]/g, "");

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const fmtDateShort = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const daysUntil = (d) => {
  if (!d) return null;
  const ms = new Date(d) - new Date("2026-04-28");
  return Math.round(ms / (1000 * 60 * 60 * 24));
};
const fmtDuration = (m, s) => {
  m = m || 0; s = s || 0;
  if (m === 0 && s === 0) return "—";
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ---------- Status / Role chips ----------
function StatusChip({ status, withDot = true }) {
  if (!status) return null;
  const cls = `chip chip-${slugify(status)}`;
  return React.createElement("span", { className: cls },
    withDot && React.createElement("span", { className: "chip-dot" }),
    status
  );
}

function RoleChip({ role }) {
  return React.createElement("span", { className: `role-chip role-${slugify(role)}` }, role);
}

// ---------- Avatar ----------
function Avatar({ profile, size = 28, title }) {
  if (!profile) return null;
  const cls = `avatar avatar-${slugify(profile.role)}`;
  return React.createElement("div", {
    className: cls,
    style: { width: size, height: size, fontSize: size * 0.38 },
    title: title || `${profile.full_name} · ${profile.role}`,
  }, profile.initials);
}
function AvatarStack({ profiles, max = 4, size = 28 }) {
  const list = profiles.slice(0, max);
  const rest = profiles.length - max;
  return React.createElement("div", { className: "avatar-stack" },
    list.map((p, i) => React.createElement(Avatar, { key: i, profile: p, size })),
    rest > 0 && React.createElement("div", {
      className: "avatar",
      style: { width: size, height: size, fontSize: size * 0.34, background: "var(--bg-sunken)", color: "var(--ink-2)" },
    }, `+${rest}`)
  );
}

// ---------- Icons (inline SVG, simple geometry only) ----------
const Icon = ({ name, size = 16 }) => {
  const paths = {
    home: "M3 11.5L10 5l7 6.5V17a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1v-5.5z",
    folder: "M3 5a1 1 0 011-1h4l1.5 1.5H16a1 1 0 011 1V15a1 1 0 01-1 1H4a1 1 0 01-1-1V5z",
    chart: "M3 17V3M3 17h14M6 13V8m4 5V5m4 8v-3",
    workload: "M4 4h12v3H4zm0 5h12v3H4zm0 5h8v3H4z",
    user: "M10 10a3 3 0 100-6 3 3 0 000 6zm-6 7a6 6 0 1112 0H4z",
    cog: "M10 6a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z",
    plus: "M10 4v12M4 10h12",
    search: "M9 15a6 6 0 100-12 6 6 0 000 12zm5-1l4 4",
    bell: "M10 3a5 5 0 015 5v3l1.5 2H3.5L5 11V8a5 5 0 015-5zm-2 14a2 2 0 004 0",
    arrow: "M4 10h12m-4-4l4 4-4 4",
    chevron: "M7 5l5 5-5 5",
    check: "M4 10l4 4 8-8",
    clock: "M10 4a6 6 0 100 12 6 6 0 000-12zm0 3v3l2 2",
    calendar: "M4 6h12v10H4V6zm0-2h12v2H4V4zM7 2v3m6-3v3",
    flag: "M5 3v14M5 4h10l-2 4 2 4H5",
    edit: "M4 14l8-8 2 2-8 8H4v-2zM12 4l2 2",
    play: "M6 4l10 6-10 6V4z",
    grid: "M3 3h6v6H3zm0 8h6v6H3zm8-8h6v6h-6zm0 8h6v6h-6z",
    list: "M3 5h14M3 10h14M3 15h14",
    timeline: "M2 10h16M5 7v6M9 5v10M13 8v4M17 6v8",
  };
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 20 20", fill: "none",
    stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round",
  }, React.createElement("path", { d: paths[name] || "" }));
};

// ---------- Pipeline mini-bar ----------
function PipelineBar({ videos }) {
  const counts = window.DCS_DATA.STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  videos.forEach(v => { if (counts[v.status] !== undefined) counts[v.status]++; });
  const total = videos.length || 1;
  const segments = window.DCS_DATA.STATUS_ORDER.map(s => ({
    status: s,
    pct: (counts[s] / total) * 100,
    count: counts[s],
  })).filter(x => x.pct > 0);
  return React.createElement("div", { className: "pipeline" },
    segments.map((seg, i) =>
      React.createElement("div", {
        key: i,
        className: "pipeline-seg",
        style: {
          width: `${seg.pct}%`,
          background: `var(--s-${slugify(seg.status).toLowerCase().replace("scheduled-for-taping", "scheduled")})`,
        },
        title: `${seg.status}: ${seg.count}`,
      })
    )
  );
}

// ---------- Progress (% done) ----------
function progressOf(p) {
  const total = p.videos.length || 1;
  const done = p.videos.filter(v => v.status === "Done").length;
  return Math.round((done / total) * 100);
}

// ---------- Project derived state ----------
function projectState(p) {
  if (p.status === "Done" || p.feedback_submission) return "Completed";
  if (p.status === "Pending") return "Pending";
  if (p.status === "Cancelled") return "Cancelled";
  const due = daysUntil(p.due_date);
  if (due !== null && due < 0) return "Overdue";
  if (due !== null && due <= 14) return "Due soon";
  return "On track";
}

window.DCS_LIB = {
  slugify, fmtDate, fmtDateShort, daysUntil, fmtDuration,
  StatusChip, RoleChip, Avatar, AvatarStack, Icon, PipelineBar,
  progressOf, projectState,
};
