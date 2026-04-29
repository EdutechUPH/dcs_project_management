/* global React, DCS_DATA, DCS_LIB */
const { useState } = React;

function ProjectDetail({ projectId, onBack }) {
  const { Icon, Avatar, AvatarStack, RoleChip, StatusChip, PipelineBar, fmtDate, fmtDateShort, fmtDuration, daysUntil, projectState, progressOf, slugify } = window.DCS_LIB;
  const p = window.DCS_DATA.PROJECTS.find(x => x.id === projectId);
  const [tab, setTab] = useState("videos");
  if (!p) return null;
  const due = daysUntil(p.due_date);
  const state = projectState(p);
  const prog = progressOf(p);
  const totalDuration = p.videos.reduce((acc, v) => acc + (v.duration_minutes || 0) * 60 + (v.duration_seconds || 0), 0);
  const totMins = Math.floor(totalDuration / 60), totSecs = totalDuration % 60;

  return React.createElement("div", null,
    // Breadcrumb
    React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 } },
      React.createElement("button", { className: "btn btn-ghost btn-sm", style: { padding: "2px 6px" }, onClick: onBack }, "Projects"),
      React.createElement("span", null, "/"),
      React.createElement("span", { style: { color: "var(--ink-2)" } }, p.course_name)
    ),

    // Header
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "flex-start", marginBottom: 20 } },
      React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } },
          React.createElement("span", { className: `chip chip-${slugify(state)}` }, React.createElement("span", { className: "chip-dot" }), state),
          React.createElement("span", { style: { fontSize: 12, color: "var(--ink-3)" } }, p.terms.name)
        ),
        React.createElement("h1", { className: "section-h", style: { fontSize: 30, marginBottom: 6 } }, p.course_name),
        React.createElement("div", { style: { fontSize: 14, color: "var(--ink-2)" } }, `${p.lecturers.name} · ${p.prodi.name}, ${p.prodi.faculties.name}`)
      ),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", { className: "btn btn-sm" }, React.createElement(Icon, { name: "edit", size: 12 }), "Edit"),
        React.createElement("button", { className: "btn btn-primary btn-sm" }, React.createElement(Icon, { name: "plus", size: 12 }), "Add video")
      )
    ),

    // Key info bar
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, padding: "16px 18px", background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", marginBottom: 24 } },
      [
        { l: "Progress", v: `${prog}%`, sub: `${p.videos.filter(v => v.status === "Done").length} of ${p.videos.length} videos` },
        { l: "Due date", v: fmtDateShort(p.due_date), sub: state === "Completed" ? "Delivered" : due < 0 ? `${Math.abs(due)}d overdue` : `in ${due} days` },
        { l: "Total runtime", v: `${totMins}:${String(totSecs).padStart(2, "0")}`, sub: "delivered" },
        { l: "Team", v: p.project_assignments.length, sub: "members" },
        { l: "Requested", v: fmtDateShort(p.created_at), sub: `by ${p.project_assignments.find(a => a.role === "Instructional Designer")?.profiles.full_name || "—"}` },
      ].map((x, i) =>
        React.createElement("div", { key: i },
          React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 4 } }, x.l),
          React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" } }, x.v),
          React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 } }, x.sub)
        )
      )
    ),

    // Pipeline horizontal viz
    React.createElement("div", { className: "card", style: { marginBottom: 24 } },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", { className: "card-title" }, "Production pipeline"),
        React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "Stages left → right; counts are videos at each stage")
      ),
      React.createElement("div", { style: { padding: "20px 18px", display: "flex", alignItems: "center", gap: 0, position: "relative" } },
        window.DCS_DATA.STATUS_ORDER.map((s, i) => {
          const count = p.videos.filter(v => v.status === s).length;
          const active = count > 0;
          return React.createElement(React.Fragment, { key: s },
            React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, opacity: active ? 1 : 0.4 } },
              React.createElement("div", { style: { width: 36, height: 36, borderRadius: "50%", background: `var(--s-${slugify(s).toLowerCase().replace("scheduled-for-taping", "scheduled")}-bg)`, color: `var(--s-${slugify(s).toLowerCase().replace("scheduled-for-taping", "scheduled")})`, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 8, border: active ? `2px solid var(--s-${slugify(s).toLowerCase().replace("scheduled-for-taping", "scheduled")})` : "2px solid transparent" } }, count),
              React.createElement("div", { style: { fontSize: 11, color: "var(--ink-2)", textAlign: "center", maxWidth: 90 } }, s)
            ),
            i < 5 && React.createElement("div", { style: { flex: 0.5, height: 1, background: "var(--line)", marginTop: -16 } })
          );
        })
      )
    ),

    // Tabs
    React.createElement("div", { style: { display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 16 } },
      ["videos", "team", "feedback", "notes"].map(t =>
        React.createElement("button", { key: t, onClick: () => setTab(t),
          style: { padding: "8px 14px", border: "none", background: "transparent", fontSize: 13, fontWeight: tab === t ? 600 : 450, color: tab === t ? "var(--ink)" : "var(--ink-3)", borderBottom: `2px solid ${tab === t ? "var(--ink)" : "transparent"}`, marginBottom: -1, textTransform: "capitalize", cursor: "pointer" } },
          t === "videos" ? `${t} (${p.videos.length})` : t === "team" ? `${t} (${p.project_assignments.length})` : t)
      )
    ),

    tab === "videos" && React.createElement("div", { className: "card" },
      React.createElement("table", { className: "data-table" },
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", { style: { width: 40 } }, "#"),
            React.createElement("th", null, "Title"),
            React.createElement("th", null, "Status"),
            React.createElement("th", null, "Editor"),
            React.createElement("th", null, "Duration"),
            React.createElement("th", null, "Subtitles"),
            React.createElement("th", null, "Notes")
          )
        ),
        React.createElement("tbody", null,
          p.videos.map(v =>
            React.createElement("tr", { key: v.id },
              React.createElement("td", { className: "tabular muted", style: { fontSize: 12 } }, String(v.position).padStart(2, "0")),
              React.createElement("td", null,
                React.createElement("div", { style: { fontWeight: 500 } }, v.title)
              ),
              React.createElement("td", null, React.createElement(StatusChip, { status: v.status })),
              React.createElement("td", null, v.profiles ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, React.createElement(Avatar, { profile: v.profiles, size: 22 }), React.createElement("span", { style: { fontSize: 12.5 } }, v.profiles.full_name.split(" ")[0])) : React.createElement("span", { className: "muted", style: { fontSize: 12 } }, "Unassigned")),
              React.createElement("td", { className: "tabular", style: { fontSize: 12.5 } }, fmtDuration(v.duration_minutes, v.duration_seconds)),
              React.createElement("td", { style: { fontSize: 11 } },
                React.createElement("div", { style: { display: "flex", gap: 4 } },
                  v.has_indonesian_subtitle && React.createElement("span", { style: { padding: "1px 5px", borderRadius: 3, background: "var(--bg-sunken)", color: "var(--ink-2)", fontFamily: "var(--font-mono)" } }, "ID"),
                  v.has_english_subtitle && React.createElement("span", { style: { padding: "1px 5px", borderRadius: 3, background: "var(--bg-sunken)", color: "var(--ink-2)", fontFamily: "var(--font-mono)" } }, "EN")
                )
              ),
              React.createElement("td", { style: { fontSize: 11.5, color: "var(--ink-3)", maxWidth: 240 } }, v.revision_notes || "—")
            )
          )
        )
      )
    ),

    tab === "team" && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 } },
      p.project_assignments.map(a =>
        React.createElement("div", { key: a.id, className: "card", style: { padding: 14, display: "flex", alignItems: "center", gap: 12 } },
          React.createElement(Avatar, { profile: a.profiles, size: 40 }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 500 } }, a.profiles.full_name),
            React.createElement("div", { style: { marginTop: 4 } }, React.createElement(RoleChip, { role: a.role }))
          ),
          React.createElement("button", { className: "btn btn-ghost btn-icon" }, React.createElement(Icon, { name: "cog", size: 14 }))
        )
      )
    ),

    tab === "feedback" && React.createElement("div", { className: "card", style: { padding: 24, textAlign: "center" } },
      React.createElement("div", { style: { fontSize: 14, color: "var(--ink-2)", marginBottom: 12 } }, "No feedback submitted yet."),
      React.createElement("button", { className: "btn btn-primary btn-sm" }, "Generate feedback link")
    ),

    tab === "notes" && React.createElement("div", { className: "card", style: { padding: 18 } },
      React.createElement("div", { style: { fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" } }, p.notes || "No internal notes for this project.")
    )
  );
}

window.DCS_PROJECT_DETAIL = ProjectDetail;
