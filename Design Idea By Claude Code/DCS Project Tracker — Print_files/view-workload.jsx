/* global React, DCS_DATA, DCS_LIB */
const { useState, useMemo } = React;

function Workload() {
  const { Avatar, RoleChip, StatusChip, slugify } = window.DCS_LIB;
  const profiles = window.DCS_DATA.PROFILES;
  const projects = window.DCS_DATA.PROJECTS;

  // Compute active workload per profile (videos in non-terminal states whose project is not Pending/Cancelled)
  const data = profiles.map(profile => {
    const assignedVideos = [];
    projects.forEach(p => {
      if (p.status === "Pending" || p.status === "Cancelled") return;
      p.videos.forEach(v => {
        if (v.status === "Done") return;
        if (v.main_editor_id === profile.id) assignedVideos.push({ project: p, video: v });
      });
      // Also count assignments
      p.project_assignments.forEach(a => {
        if (a.profiles.id === profile.id) {
          p.videos.forEach(v => {
            if (v.status !== "Done" && !assignedVideos.find(x => x.video.id === v.id)) {
              assignedVideos.push({ project: p, video: v, viaAssignment: true });
            }
          });
        }
      });
    });
    return { profile, videos: assignedVideos };
  }).sort((a, b) => b.videos.length - a.videos.length);

  const max = Math.max(...data.map(d => d.videos.length), 1);

  return React.createElement("div", null,
    React.createElement("div", { style: { marginBottom: 18 } },
      React.createElement("h2", { className: "section-h" }, "Team workload"),
      React.createElement("p", { className: "section-sub" }, "Active video assignments across non-pending, non-cancelled projects.")
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { style: { padding: "10px 18px", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "240px 1fr 80px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 500 } },
        React.createElement("div", null, "Member"),
        React.createElement("div", null, "Active video pipeline"),
        React.createElement("div", { style: { textAlign: "right" } }, "Active")
      ),
      data.map(({ profile, videos }) => {
        const byStatus = {};
        window.DCS_DATA.STATUS_ORDER.slice(0, -1).forEach(s => byStatus[s] = 0);
        videos.forEach(({ video }) => { if (byStatus[video.status] !== undefined) byStatus[video.status]++; });
        const totalCount = videos.length;
        const widthPct = (totalCount / max) * 100;
        const tone = totalCount === 0 ? "low" : totalCount <= 3 ? "ok" : totalCount <= 6 ? "high" : "overloaded";
        const toneColor = { low: "var(--ink-3)", ok: "var(--s-done)", high: "var(--s-review)", overloaded: "var(--s-cancelled)" }[tone];
        return React.createElement("div", { key: profile.id, style: { padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "240px 1fr 80px", alignItems: "center", gap: 14 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement(Avatar, { profile, size: 32 }),
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 13, fontWeight: 500 } }, profile.full_name),
              React.createElement("div", { style: { marginTop: 3 } }, React.createElement(RoleChip, { role: profile.role }))
            )
          ),
          React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", height: 24, borderRadius: 4, overflow: "hidden", background: "var(--bg-sunken)", maxWidth: `${Math.max(widthPct, totalCount === 0 ? 0 : 8)}%`, minWidth: totalCount === 0 ? 0 : 80, transition: "max-width 0.4s" } },
              window.DCS_DATA.STATUS_ORDER.slice(0, -1).map(s => byStatus[s] > 0 && React.createElement("div", {
                key: s,
                title: `${s}: ${byStatus[s]}`,
                style: { flex: byStatus[s], background: `var(--s-${slugify(s).toLowerCase().replace("scheduled-for-taping", "scheduled")})`, display: "grid", placeItems: "center", fontSize: 10.5, color: "white", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
              }, byStatus[s])).filter(Boolean)
            )
          ),
          React.createElement("div", { style: { textAlign: "right" } },
            React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, color: toneColor, lineHeight: 1 } }, totalCount),
            React.createElement("div", { style: { fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 } }, tone)
          )
        );
      })
    )
  );
}

window.DCS_WORKLOAD = Workload;
