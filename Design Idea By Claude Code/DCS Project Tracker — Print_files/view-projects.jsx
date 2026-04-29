/* global React, DCS_DATA, DCS_LIB */
const { useState, useMemo } = React;

function ProjectsList({ onNavProject, onNewProject }) {
  const { Icon, AvatarStack, StatusChip, PipelineBar, fmtDateShort, daysUntil, projectState, progressOf, slugify } = window.DCS_LIB;
  const projects = window.DCS_DATA.PROJECTS;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table"); // table | board

  const filtered = projects.filter(p => {
    if (filter === "active" && (p.status === "Done" || p.feedback_submission || p.status === "Cancelled")) return false;
    if (filter === "completed" && !(p.status === "Done" || p.feedback_submission)) return false;
    if (filter === "overdue" && !(daysUntil(p.due_date) < 0 && p.status !== "Done" && !p.feedback_submission)) return false;
    if (search && !p.course_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" } },
      React.createElement("div", { style: { display: "flex", gap: 2, padding: 2, background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: 8 } },
        ["all", "active", "completed", "overdue"].map(f =>
          React.createElement("button", {
            key: f,
            onClick: () => setFilter(f),
            className: "btn btn-sm",
            style: { background: filter === f ? "var(--bg-elev)" : "transparent", border: "none", textTransform: "capitalize", boxShadow: filter === f ? "var(--shadow-sm)" : "none" },
          }, f)
        )
      ),
      React.createElement("div", { style: { position: "relative", flex: 1, maxWidth: 360 } },
        React.createElement("div", { style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" } },
          React.createElement(Icon, { name: "search", size: 14 })
        ),
        React.createElement("input", {
          className: "input",
          style: { width: "100%", paddingLeft: 32 },
          placeholder: "Search by course name…",
          value: search,
          onChange: e => setSearch(e.target.value),
        })
      ),
      React.createElement("div", { style: { flex: 1 } }),
      React.createElement("div", { style: { display: "flex", gap: 2, padding: 2, background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: 8 } },
        [{ k: "table", i: "list" }, { k: "board", i: "grid" }].map(v =>
          React.createElement("button", {
            key: v.k, onClick: () => setView(v.k),
            className: "btn btn-sm btn-icon",
            style: { background: view === v.k ? "var(--bg-elev)" : "transparent", border: "none", boxShadow: view === v.k ? "var(--shadow-sm)" : "none" },
          }, React.createElement(Icon, { name: v.i, size: 14 }))
        )
      ),
      React.createElement("button", { className: "btn btn-primary btn-sm", onClick: onNewProject }, React.createElement(Icon, { name: "plus", size: 12 }), "New project")
    ),

    view === "table" ?
    React.createElement("div", { className: "card" },
      React.createElement("table", { className: "data-table" },
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Course / Lecturer"),
            React.createElement("th", null, "Faculty / Prodi"),
            React.createElement("th", null, "Pipeline"),
            React.createElement("th", null, "Videos"),
            React.createElement("th", null, "Team"),
            React.createElement("th", null, "Due"),
            React.createElement("th", null, "Status")
          )
        ),
        React.createElement("tbody", null,
          filtered.map(p => {
            const due = daysUntil(p.due_date);
            const state = projectState(p);
            const done = p.videos.filter(v => v.status === "Done").length;
            return React.createElement("tr", { key: p.id, onClick: () => onNavProject(p.id) },
              React.createElement("td", null,
                React.createElement("div", { style: { fontWeight: 500 } }, p.course_name),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 } }, p.lecturers.name)
              ),
              React.createElement("td", { style: { fontSize: 12.5 } },
                React.createElement("div", null, p.prodi.name),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 } }, p.prodi.faculties.name)
              ),
              React.createElement("td", { style: { width: 180 } }, React.createElement(PipelineBar, { videos: p.videos })),
              React.createElement("td", { className: "tabular", style: { fontSize: 12.5 } }, `${done} / ${p.videos.length}`),
              React.createElement("td", null, React.createElement(AvatarStack, { profiles: p.project_assignments.map(a => a.profiles), size: 24 })),
              React.createElement("td", { className: "tabular", style: { fontSize: 12.5 } },
                fmtDateShort(p.due_date),
                React.createElement("div", { style: { fontSize: 11, color: due < 0 && state !== "Completed" ? "var(--s-cancelled)" : "var(--ink-3)", marginTop: 2 } }, state === "Completed" ? "Delivered" : due < 0 ? `${Math.abs(due)}d overdue` : `in ${due}d`)
              ),
              React.createElement("td", null, React.createElement("span", { className: `chip chip-${slugify(state)}` }, React.createElement("span", { className: "chip-dot" }), state))
            );
          })
        )
      )
    ) :
    // Board view
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 } },
      filtered.map(p => {
        const due = daysUntil(p.due_date);
        const state = projectState(p);
        const prog = progressOf(p);
        return React.createElement("div", { key: p.id, className: "card", onClick: () => onNavProject(p.id), style: { cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s" } },
          React.createElement("div", { style: { padding: "14px 16px", borderBottom: "1px solid var(--line)" } },
            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 } },
              React.createElement("span", { className: `chip chip-${slugify(state)}` }, React.createElement("span", { className: "chip-dot" }), state),
              React.createElement("span", { style: { fontSize: 11, color: "var(--ink-3)" } }, fmtDateShort(p.due_date))
            ),
            React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.25 } }, p.course_name),
            React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 } }, `${p.lecturers.name} · ${p.prodi.name}`)
          ),
          React.createElement("div", { style: { padding: "12px 16px" } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, color: "var(--ink-3)" } },
              React.createElement("span", null, "Progress"),
              React.createElement("span", { className: "tabular" }, `${p.videos.filter(v => v.status === "Done").length}/${p.videos.length} videos`)
            ),
            React.createElement(PipelineBar, { videos: p.videos })
          ),
          React.createElement("div", { style: { padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-soft)" } },
            React.createElement(AvatarStack, { profiles: p.project_assignments.map(a => a.profiles), size: 22 }),
            React.createElement("span", { className: "tabular", style: { fontSize: 11.5, fontWeight: 500 } }, `${prog}%`)
          )
        );
      })
    )
  );
}

window.DCS_PROJECTS_LIST = ProjectsList;
