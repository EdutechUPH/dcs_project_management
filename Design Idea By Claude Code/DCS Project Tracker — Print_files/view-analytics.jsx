/* global React, DCS_DATA, DCS_LIB */
const { useMemo } = React;

function Analytics() {
  const { Icon, Avatar, slugify } = window.DCS_LIB;
  const { VIDEOS_COMPLETED_TREND, SATISFACTION_TREND, FEEDBACK_CATEGORIES, PROFILES, PROJECTS } = window.DCS_DATA;

  const totalDone = PROJECTS.flatMap(p => p.videos).filter(v => v.status === "Done").length;
  const totalMins = PROJECTS.flatMap(p => p.videos).reduce((acc, v) => acc + (v.duration_minutes || 0), 0);
  const avgSat = 4.65;

  // Sparkline / line chart helper
  const chartW = 720, chartH = 220, pad = 40;

  const trendMax = Math.max(...VIDEOS_COMPLETED_TREND.map(d => d.count));
  const trendPath = VIDEOS_COMPLETED_TREND.map((d, i) => {
    const x = pad + (i / (VIDEOS_COMPLETED_TREND.length - 1)) * (chartW - pad * 2);
    const y = chartH - pad - (d.count / trendMax) * (chartH - pad * 2);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  const trendArea = trendPath + ` L ${pad + (chartW - pad * 2)} ${chartH - pad} L ${pad} ${chartH - pad} Z`;

  // Editor leaderboard
  const editorStats = PROFILES.filter(p => p.role === "Digital Content Specialist").map(profile => {
    const videos = PROJECTS.flatMap(p => p.videos).filter(v => v.main_editor_id === profile.id);
    const done = videos.filter(v => v.status === "Done").length;
    const minutes = videos.filter(v => v.status === "Done").reduce((a, v) => a + (v.duration_minutes || 0), 0);
    return { profile, done, minutes, active: videos.filter(v => v.status !== "Done").length };
  }).sort((a, b) => b.done - a.done);
  const maxDone = Math.max(...editorStats.map(e => e.done), 1);

  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 } },
      React.createElement("div", null,
        React.createElement("h2", { className: "section-h" }, "Analytics"),
        React.createElement("p", { className: "section-sub" }, "Spring 2026 · all faculties · all editors")
      ),
      React.createElement("div", { style: { display: "flex", gap: 6 } },
        React.createElement("button", { className: "btn btn-sm" }, "Last 90 days", React.createElement(Icon, { name: "chevron", size: 12 })),
        React.createElement("button", { className: "btn btn-sm" }, "Filter", React.createElement(Icon, { name: "chevron", size: 12 }))
      )
    ),

    // KPI strip
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 } },
      [
        { l: "Videos completed", v: totalDone, sub: "+18 vs prev period", up: true },
        { l: "Total runtime", v: `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`, sub: "delivered" },
        { l: "Avg. satisfaction", v: avgSat.toFixed(2), sub: "across 9 lecturers", up: true },
        { l: "On-time rate", v: "82%", sub: "+4% vs prev period", up: true },
      ].map((s, i) =>
        React.createElement("div", { key: i, className: "stat" },
          React.createElement("div", { className: "stat-label" }, s.l),
          React.createElement("div", { className: "stat-value tabular" }, s.v),
          React.createElement("div", { className: `stat-delta ${s.up ? "stat-delta-up" : ""}` }, s.sub)
        )
      )
    ),

    // Two-column
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 18 } },
      // Completion trend
      React.createElement("div", { className: "card" },
        React.createElement("div", { className: "card-header" },
          React.createElement("div", { className: "card-title" }, "Videos completed over time"),
          React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "Weekly cadence")
        ),
        React.createElement("div", { style: { padding: 12 } },
          React.createElement("svg", { viewBox: `0 0 ${chartW} ${chartH}`, style: { width: "100%", height: "auto", display: "block" } },
            React.createElement("defs", null,
              React.createElement("linearGradient", { id: "g1", x1: 0, y1: 0, x2: 0, y2: 1 },
                React.createElement("stop", { offset: 0, stopColor: "var(--accent)", stopOpacity: 0.25 }),
                React.createElement("stop", { offset: 1, stopColor: "var(--accent)", stopOpacity: 0 })
              )
            ),
            // grid
            [0, 0.25, 0.5, 0.75, 1].map(t =>
              React.createElement("line", { key: t, x1: pad, x2: chartW - pad, y1: pad + t * (chartH - pad * 2), y2: pad + t * (chartH - pad * 2), stroke: "var(--line)", strokeDasharray: "2,3" })
            ),
            React.createElement("path", { d: trendArea, fill: "url(#g1)" }),
            React.createElement("path", { d: trendPath, fill: "none", stroke: "var(--accent)", strokeWidth: 2 }),
            VIDEOS_COMPLETED_TREND.map((d, i) => {
              const x = pad + (i / (VIDEOS_COMPLETED_TREND.length - 1)) * (chartW - pad * 2);
              const y = chartH - pad - (d.count / trendMax) * (chartH - pad * 2);
              return React.createElement("circle", { key: i, cx: x, cy: y, r: 3, fill: "var(--bg-elev)", stroke: "var(--accent)", strokeWidth: 1.6 });
            }),
            // x labels
            VIDEOS_COMPLETED_TREND.filter((_, i) => i % 4 === 0 || i === VIDEOS_COMPLETED_TREND.length - 1).map((d, idx, arr) => {
              const i = VIDEOS_COMPLETED_TREND.indexOf(d);
              const x = pad + (i / (VIDEOS_COMPLETED_TREND.length - 1)) * (chartW - pad * 2);
              return React.createElement("text", { key: i, x, y: chartH - 12, textAnchor: "middle", fontSize: 11, fill: "var(--ink-3)" }, d.week);
            })
          )
        )
      ),
      // Feedback radial
      React.createElement("div", { className: "card" },
        React.createElement("div", { className: "card-header" },
          React.createElement("div", { className: "card-title" }, "Feedback by category"),
          React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "5-pt scale")
        ),
        React.createElement("div", { style: { padding: "16px 20px" } },
          FEEDBACK_CATEGORIES.map(c =>
            React.createElement("div", { key: c.category, style: { display: "grid", gridTemplateColumns: "120px 1fr 40px", alignItems: "center", gap: 12, padding: "8px 0" } },
              React.createElement("div", { style: { fontSize: 12.5 } }, c.category),
              React.createElement("div", { style: { height: 6, borderRadius: 3, background: "var(--bg-sunken)", overflow: "hidden" } },
                React.createElement("div", { style: { width: `${(c.score / 5) * 100}%`, height: "100%", background: c.score < 4.2 ? "var(--s-review)" : "var(--s-done)", transition: "width 0.6s" } })
              ),
              React.createElement("div", { className: "tabular", style: { fontSize: 12.5, textAlign: "right", fontWeight: 500 } }, c.score.toFixed(2))
            )
          )
        )
      )
    ),

    // Editor leaderboard
    React.createElement("div", { className: "card", style: { marginBottom: 18 } },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", { className: "card-title" }, "Editor leaderboard"),
        React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "Videos delivered this term")
      ),
      React.createElement("div", { style: { padding: "12px 18px" } },
        editorStats.map((e, i) =>
          React.createElement("div", { key: e.profile.id, style: { display: "grid", gridTemplateColumns: "30px 200px 1fr 60px", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < editorStats.length - 1 ? "1px solid var(--line)" : "none" } },
            React.createElement("div", { className: "tabular", style: { fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink-3)" } }, String(i + 1).padStart(2, "0")),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
              React.createElement(Avatar, { profile: e.profile, size: 28 }),
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 13, fontWeight: 500 } }, e.profile.full_name),
                React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)" } }, `${e.minutes}m delivered · ${e.active} active`)
              )
            ),
            React.createElement("div", { style: { height: 6, borderRadius: 3, background: "var(--bg-sunken)", overflow: "hidden" } },
              React.createElement("div", { style: { width: `${(e.done / maxDone) * 100}%`, height: "100%", background: "var(--accent)", transition: "width 0.6s" } })
            ),
            React.createElement("div", { className: "tabular", style: { textAlign: "right", fontWeight: 500 } }, e.done)
          )
        )
      )
    ),

    // ============ EXTRA VISUALIZATIONS ============
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 } },
      // 1. Faculty load donut
      React.createElement(FacultyDonut, null),
      // 2. Status flow funnel
      React.createElement(StatusFunnel, null)
    ),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 18 } },
      // 3. Cycle-time per stage
      React.createElement(CycleTime, null),
      // 4. Subtitle coverage
      React.createElement(SubtitleCoverage, null)
    ),

    // 5. Heatmap
    React.createElement(VelocityHeatmap, null)
  );
}

// =============== 1. FACULTY DONUT ===============
function FacultyDonut() {
  const { PROJECTS, FACULTIES } = window.DCS_DATA;
  const counts = FACULTIES.map(f => ({
    name: f.name, count: PROJECTS.filter(p => p.faculty_id === f.id).length,
    videos: PROJECTS.filter(p => p.faculty_id === f.id).flatMap(p => p.videos).length,
  })).filter(x => x.count > 0);
  const total = counts.reduce((a, x) => a + x.videos, 0);
  const palette = ["var(--s-scheduled)", "var(--s-audio)", "var(--s-video)", "var(--s-review)", "var(--s-done)"];
  const R = 70, C = 90;
  let cum = 0;
  const segs = counts.map((c, i) => {
    const start = cum / total * 360;
    cum += c.videos;
    const end = cum / total * 360;
    const a1 = (start - 90) * Math.PI / 180, a2 = (end - 90) * Math.PI / 180;
    const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
    const x2 = C + R * Math.cos(a2), y2 = C + R * Math.sin(a2);
    const large = end - start > 180 ? 1 : 0;
    return { d: `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`, fill: palette[i % palette.length], ...c };
  });
  return React.createElement("div", { className: "card" },
    React.createElement("div", { className: "card-header" },
      React.createElement("div", { className: "card-title" }, "Workload by faculty"),
      React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, `${total} videos`)
    ),
    React.createElement("div", { style: { padding: 18, display: "flex", gap: 18, alignItems: "center" } },
      React.createElement("svg", { width: 180, height: 180, viewBox: "0 0 180 180", style: { flexShrink: 0 } },
        segs.map((s, i) => React.createElement("path", { key: i, d: s.d, fill: s.fill, stroke: "var(--bg-elev)", strokeWidth: 2 })),
        React.createElement("circle", { cx: 90, cy: 90, r: 38, fill: "var(--bg-elev)" }),
        React.createElement("text", { x: 90, y: 86, textAnchor: "middle", fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 500, fill: "var(--ink)" }, total),
        React.createElement("text", { x: 90, y: 102, textAnchor: "middle", fontSize: 10, fill: "var(--ink-3)", letterSpacing: "0.06em" }, "VIDEOS")
      ),
      React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8 } },
        segs.map((s, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } },
          React.createElement("div", { style: { width: 10, height: 10, borderRadius: 2, background: s.fill } }),
          React.createElement("div", { style: { flex: 1, color: "var(--ink-2)" } }, s.name.replace("Faculty of ", "")),
          React.createElement("div", { className: "tabular", style: { fontWeight: 500 } }, s.videos),
          React.createElement("div", { className: "tabular muted", style: { fontSize: 11, width: 36, textAlign: "right" } }, `${Math.round(s.videos / total * 100)}%`)
        ))
      )
    )
  );
}

// =============== 2. PIPELINE FUNNEL ===============
function StatusFunnel() {
  const { PROJECTS, STATUS_ORDER } = window.DCS_DATA;
  const allVideos = PROJECTS.flatMap(p => p.videos);
  // Cumulative: how many have reached at least each stage
  const cumulative = STATUS_ORDER.map((s, i) => {
    const reached = STATUS_ORDER.slice(i).reduce((a, st) => a + allVideos.filter(v => v.status === st).length, 0);
    return { stage: s, count: reached };
  });
  const max = cumulative[0].count;
  const { slugify } = window.DCS_LIB;
  return React.createElement("div", { className: "card" },
    React.createElement("div", { className: "card-header" },
      React.createElement("div", { className: "card-title" }, "Pipeline funnel"),
      React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "Conversion through stages")
    ),
    React.createElement("div", { style: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 } },
      cumulative.map((c, i) => {
        const w = (c.count / max) * 100;
        const conv = i === 0 ? 100 : Math.round(c.count / cumulative[i - 1].count * 100);
        const key = slugify(c.stage).toLowerCase().replace("scheduled-for-taping", "scheduled");
        return React.createElement("div", { key: i, style: { display: "grid", gridTemplateColumns: "150px 1fr 70px", alignItems: "center", gap: 12 } },
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-2)" } }, c.stage),
          React.createElement("div", { style: { height: 22, background: "var(--bg-sunken)", borderRadius: 4, overflow: "hidden", position: "relative" } },
            React.createElement("div", { style: { width: `${w}%`, height: "100%", background: `var(--s-${key})`, transition: "width 0.5s", display: "flex", alignItems: "center", paddingLeft: 8, color: "white", fontSize: 11, fontWeight: 600 } }, c.count)
          ),
          React.createElement("div", { className: "tabular", style: { fontSize: 11.5, color: i > 0 && conv < 80 ? "var(--s-cancelled)" : "var(--ink-3)", textAlign: "right" } }, i === 0 ? "—" : `${conv}%`)
        );
      })
    )
  );
}

// =============== 3. CYCLE TIME ===============
function CycleTime() {
  // Synthetic: avg days at each stage
  const stages = [
    { name: "Requested → Scheduled", days: 3.2, target: 5 },
    { name: "Scheduled → Taping done", days: 6.8, target: 7 },
    { name: "Audio Editing", days: 2.4, target: 3 },
    { name: "Video Editing", days: 8.1, target: 7 },
    { name: "Review", days: 4.6, target: 4 },
  ];
  const max = Math.max(...stages.map(s => Math.max(s.days, s.target)));
  return React.createElement("div", { className: "card" },
    React.createElement("div", { className: "card-header" },
      React.createElement("div", { className: "card-title" }, "Average cycle time per stage"),
      React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "Days · target shown as marker")
    ),
    React.createElement("div", { style: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 } },
      stages.map((s, i) => {
        const over = s.days > s.target;
        const w = (s.days / max) * 100;
        const tw = (s.target / max) * 100;
        return React.createElement("div", { key: i },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
            React.createElement("span", { style: { fontSize: 12.5 } }, s.name),
            React.createElement("span", { className: "tabular", style: { fontSize: 12, fontWeight: 500, color: over ? "var(--s-cancelled)" : "var(--s-done)" } }, `${s.days}d`, React.createElement("span", { style: { color: "var(--ink-3)", fontWeight: 400, marginLeft: 6 } }, `target ${s.target}d`))
          ),
          React.createElement("div", { style: { height: 10, background: "var(--bg-sunken)", borderRadius: 5, position: "relative", overflow: "hidden" } },
            React.createElement("div", { style: { width: `${w}%`, height: "100%", background: over ? "var(--s-cancelled)" : "var(--accent)", borderRadius: 5, transition: "width 0.5s" } }),
            React.createElement("div", { style: { position: "absolute", left: `${tw}%`, top: -3, width: 2, height: 16, background: "var(--ink)", transform: "translateX(-1px)" } })
          )
        );
      })
    )
  );
}

// =============== 4. SUBTITLE COVERAGE ===============
function SubtitleCoverage() {
  const { PROJECTS } = window.DCS_DATA;
  const done = PROJECTS.flatMap(p => p.videos).filter(v => v.status === "Done");
  const both = done.filter(v => v.has_indonesian_subtitle && v.has_english_subtitle).length;
  const idOnly = done.filter(v => v.has_indonesian_subtitle && !v.has_english_subtitle).length;
  const enOnly = done.filter(v => !v.has_indonesian_subtitle && v.has_english_subtitle).length;
  const none = done.filter(v => !v.has_indonesian_subtitle && !v.has_english_subtitle).length;
  const total = done.length || 1;
  const segs = [
    { l: "ID + EN", v: both, c: "var(--s-done)" },
    { l: "ID only", v: idOnly, c: "var(--s-scheduled)" },
    { l: "EN only", v: enOnly, c: "var(--s-audio)" },
    { l: "None", v: none, c: "var(--s-cancelled)" },
  ];
  return React.createElement("div", { className: "card" },
    React.createElement("div", { className: "card-header" },
      React.createElement("div", { className: "card-title" }, "Subtitle coverage"),
      React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, `${done.length} delivered`)
    ),
    React.createElement("div", { style: { padding: 18 } },
      React.createElement("div", { style: { display: "flex", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 14 } },
        segs.filter(s => s.v > 0).map((s, i) => React.createElement("div", { key: i, style: { flex: s.v, background: s.c, display: "grid", placeItems: "center", color: "white", fontSize: 11, fontWeight: 600 } }, s.v))
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
        segs.map((s, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } },
          React.createElement("div", { style: { width: 10, height: 10, borderRadius: 2, background: s.c } }),
          React.createElement("div", { style: { flex: 1 } }, s.l),
          React.createElement("div", { className: "tabular muted" }, `${Math.round(s.v / total * 100)}%`)
        ))
      )
    )
  );
}

// =============== 5. VELOCITY HEATMAP ===============
function VelocityHeatmap() {
  // Editor x Week heatmap of videos completed
  const { PROFILES } = window.DCS_DATA;
  const editors = PROFILES.filter(p => p.role === "Digital Content Specialist");
  const weeks = ["W1 Mar", "W2 Mar", "W3 Mar", "W4 Mar", "W1 Apr", "W2 Apr", "W3 Apr", "W4 Apr"];
  // synthetic but deterministic
  const grid = editors.map((e, i) =>
    weeks.map((w, j) => {
      const seed = (i * 7 + j * 3) % 11;
      return seed < 2 ? 0 : seed < 5 ? 1 : seed < 8 ? 2 : seed < 10 ? 3 : 4;
    })
  );
  const colors = ["var(--bg-sunken)", "oklch(0.88 0.05 145)", "oklch(0.78 0.1 145)", "oklch(0.65 0.13 145)", "oklch(0.5 0.15 145)"];
  return React.createElement("div", { className: "card" },
    React.createElement("div", { className: "card-header" },
      React.createElement("div", { className: "card-title" }, "Editor velocity heatmap"),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-3)" } },
        "Less",
        React.createElement("div", { style: { display: "flex", gap: 2 } },
          colors.map((c, i) => React.createElement("div", { key: i, style: { width: 12, height: 12, background: c, borderRadius: 2 } }))
        ),
        "More"
      )
    ),
    React.createElement("div", { style: { padding: "16px 20px", overflow: "auto" } },
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: `140px repeat(${weeks.length}, 1fr)`, gap: 4, alignItems: "center", minWidth: 600 } },
        React.createElement("div", null),
        weeks.map((w, i) => React.createElement("div", { key: i, style: { fontSize: 10.5, color: "var(--ink-3)", textAlign: "center" } }, w)),
        editors.flatMap((e, i) => [
          React.createElement("div", { key: `n-${i}`, style: { fontSize: 12, color: "var(--ink-2)", paddingRight: 8 } }, e.full_name.split(" ")[0] + " " + e.full_name.split(" ")[1][0] + "."),
          ...weeks.map((w, j) => React.createElement("div", { key: `c-${i}-${j}`, title: `${e.full_name} · ${w}: ${grid[i][j]} videos`, style: { aspectRatio: "1", background: colors[grid[i][j]], borderRadius: 3, transition: "transform 0.1s", cursor: "default" } }))
        ])
      )
    )
  );
}

window.DCS_ANALYTICS = Analytics;
