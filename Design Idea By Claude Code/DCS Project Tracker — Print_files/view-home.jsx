/* global React, DCS_DATA, DCS_LIB */
const { useState, useMemo } = React;

function Home({ role, onNavProject }) {
  const { Icon, Avatar, AvatarStack, StatusChip, PipelineBar, fmtDateShort, daysUntil, projectState, progressOf } = window.DCS_LIB;
  const projects = window.DCS_DATA.PROJECTS;
  const active = projects.filter(p => p.status !== "Done" && !p.feedback_submission && p.status !== "Cancelled");
  const overdue = active.filter(p => daysUntil(p.due_date) < 0);
  const dueSoon = active.filter(p => { const d = daysUntil(p.due_date); return d >= 0 && d <= 14; });
  const totalVideos = projects.flatMap(p => p.videos).length;
  const doneVideos = projects.flatMap(p => p.videos).filter(v => v.status === "Done").length;
  const inReview = projects.flatMap(p => p.videos).filter(v => v.status === "Review").length;

  const stats = [
    { label: "Active projects", value: active.length, delta: "+2 this week", up: true },
    { label: "Videos completed", value: doneVideos, delta: `of ${totalVideos} total`, up: null },
    { label: "In review", value: inReview, delta: "Awaiting feedback", up: null },
    { label: "Overdue", value: overdue.length, delta: overdue.length ? "Action needed" : "None", up: !overdue.length },
  ];

  // Pipeline counts across whole system
  const pipelineCounts = {};
  window.DCS_DATA.STATUS_ORDER.forEach(s => pipelineCounts[s] = 0);
  projects.forEach(p => p.videos.forEach(v => { if (pipelineCounts[v.status] !== undefined) pipelineCounts[v.status]++; }));
  const pipeMax = Math.max(...Object.values(pipelineCounts), 1);

  return React.createElement("div", null,
    // Hero stats
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 } },
      stats.map((s, i) =>
        React.createElement("div", { key: i, className: "stat" },
          React.createElement("div", { className: "stat-label" }, s.label),
          React.createElement("div", { className: "stat-value tabular" }, s.value),
          React.createElement("div", { className: `stat-delta ${s.up === true ? "stat-delta-up" : s.up === false ? "stat-delta-down" : ""}` }, s.delta)
        )
      )
    ),

    // Pipeline view + Action queue
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 24 } },
      // Pipeline by status
      React.createElement("div", { className: "card" },
        React.createElement("div", { className: "card-header" },
          React.createElement("div", null,
            React.createElement("div", { className: "card-title" }, "Production pipeline"),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", marginTop: 2 } }, "Videos by current stage, all active projects")
          ),
          React.createElement("button", { className: "btn btn-ghost btn-sm" }, "View all", React.createElement(Icon, { name: "arrow", size: 12 }))
        ),
        React.createElement("div", { className: "card-body", style: { padding: 0 } },
          window.DCS_DATA.STATUS_ORDER.map((s, i) => {
            const count = pipelineCounts[s];
            const w = (count / pipeMax) * 100;
            return React.createElement("div", { key: s, style: { display: "grid", gridTemplateColumns: "180px 1fr 50px", alignItems: "center", padding: "10px 18px", borderBottom: i < 5 ? "1px solid var(--line)" : "none", gap: 14 } },
              React.createElement(StatusChip, { status: s }),
              React.createElement("div", { style: { height: 8, borderRadius: 4, background: "var(--bg-sunken)", overflow: "hidden" } },
                React.createElement("div", { style: { width: `${w}%`, height: "100%", background: `var(--s-${window.DCS_LIB.slugify(s).toLowerCase().replace("scheduled-for-taping", "scheduled")})`, transition: "width 0.4s" } })
              ),
              React.createElement("div", { className: "tabular", style: { fontWeight: 500, textAlign: "right", color: "var(--ink)" } }, count)
            );
          })
        )
      ),
      // Action queue
      React.createElement("div", { className: "card" },
        React.createElement("div", { className: "card-header" },
          React.createElement("div", { className: "card-title" }, "Needs your attention"),
          React.createElement("span", { className: "chip chip-Review" }, React.createElement("span", { className: "chip-dot" }), `${overdue.length + inReview} items`)
        ),
        React.createElement("div", { className: "card-body", style: { padding: 0 } },
          [...overdue.slice(0, 2).map(p => ({ p, kind: "overdue" })), ...projects.flatMap(p => p.videos.filter(v => v.status === "Review").map(v => ({ p, v, kind: "review" }))).slice(0, 4)].map((item, i) =>
            React.createElement("button", { key: i, onClick: () => onNavProject(item.p.id), style: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 18px", borderBottom: "1px solid var(--line)", background: "transparent", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--line)", cursor: "pointer", textAlign: "left" } },
              React.createElement("div", { style: { width: 32, height: 32, borderRadius: 8, background: item.kind === "overdue" ? "var(--s-cancelled-bg)" : "var(--s-review-bg)", color: item.kind === "overdue" ? "var(--s-cancelled)" : "var(--s-review)", display: "grid", placeItems: "center", flexShrink: 0 } },
                React.createElement(Icon, { name: item.kind === "overdue" ? "flag" : "play", size: 14 })
              ),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, item.kind === "overdue" ? `${item.p.course_name} is overdue` : item.v.title),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 } }, item.kind === "overdue" ? `Due ${fmtDateShort(item.p.due_date)} · ${Math.abs(daysUntil(item.p.due_date))}d ago` : `${item.p.course_name} · awaiting review`)
              ),
              React.createElement(Icon, { name: "chevron", size: 14 })
            )
          )
        )
      )
    ),

    // Active projects table
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", null,
          React.createElement("div", { className: "card-title" }, "Active projects"),
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", marginTop: 2 } }, `${active.length} projects in flight`)
        ),
        React.createElement("button", { className: "btn btn-primary btn-sm" }, React.createElement(Icon, { name: "plus", size: 12 }), "New project")
      ),
      React.createElement("table", { className: "data-table" },
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Course"),
            React.createElement("th", null, "Pipeline"),
            React.createElement("th", null, "Progress"),
            React.createElement("th", null, "Team"),
            React.createElement("th", null, "Due"),
            React.createElement("th", null, "Status")
          )
        ),
        React.createElement("tbody", null,
          active.slice(0, 6).map(p => {
            const prog = progressOf(p);
            const due = daysUntil(p.due_date);
            const state = projectState(p);
            return React.createElement("tr", { key: p.id, onClick: () => onNavProject(p.id) },
              React.createElement("td", null,
                React.createElement("div", { style: { fontWeight: 500 } }, p.course_name),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 } }, `${p.prodi.name} · ${p.lecturers.name}`)
              ),
              React.createElement("td", { style: { width: 200 } }, React.createElement(PipelineBar, { videos: p.videos })),
              React.createElement("td", { style: { width: 120 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                  React.createElement("div", { className: "tabular", style: { fontSize: 12, fontWeight: 500, minWidth: 32 } }, `${prog}%`),
                  React.createElement("div", { style: { flex: 1, height: 4, borderRadius: 2, background: "var(--bg-sunken)", overflow: "hidden" } },
                    React.createElement("div", { style: { width: `${prog}%`, height: "100%", background: "var(--ink)" } })
                  )
                )
              ),
              React.createElement("td", null, React.createElement(AvatarStack, { profiles: p.project_assignments.map(a => a.profiles), size: 24 })),
              React.createElement("td", { className: "tabular muted", style: { fontSize: 12.5 } },
                fmtDateShort(p.due_date),
                React.createElement("div", { style: { fontSize: 11, color: due < 0 ? "var(--s-cancelled)" : due <= 14 ? "var(--s-review)" : "var(--ink-3)", marginTop: 2 } }, due < 0 ? `${Math.abs(due)}d overdue` : `in ${due}d`)
              ),
              React.createElement("td", null, React.createElement("span", { className: `chip chip-${window.DCS_LIB.slugify(state)}` }, React.createElement("span", { className: "chip-dot" }), state))
            );
          })
        )
      )
    )
  );
}

const Icon = window.DCS_LIB.Icon;
window.DCS_HOME = Home;
