/* global React, DCS_DATA, DCS_LIB */
const { useState, useMemo } = React;

function NewProject({ onBack, onCreated }) {
  const { Icon, Avatar, RoleChip, slugify, fmtDateShort } = window.DCS_LIB;
  const { TERMS, FACULTIES, PRODI, LECTURERS, PROFILES } = window.DCS_DATA;

  const [step, setStep] = useState(1); // 1: course, 2: videos, 3: team, 4: review
  const [form, setForm] = useState({
    course_name: "",
    term_id: 1,
    faculty_id: null,
    prodi_id: null,
    lecturer_id: null,
    due_date: "",
    notes: "",
    project_folder_url: "",
    videos: [{ id: 1, title: "" }],
    assignments: [], // {role, profile_id}
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const prodiOptions = PRODI.filter(p => !form.faculty_id || p.faculty_id === form.faculty_id);

  // Derived
  const lecturer = LECTURERS.find(l => l.id === form.lecturer_id);
  const faculty = FACULTIES.find(f => f.id === form.faculty_id);
  const prodi = PRODI.find(p => p.id === form.prodi_id);
  const term = TERMS.find(t => t.id === form.term_id);
  const validVideos = form.videos.filter(v => v.title.trim().length);
  const hasMainEditor = form.assignments.some(a => a.role === "Main Editor / Videographer");
  const hasID = form.assignments.some(a => a.role === "Instructional Designer");

  // Step validity
  const stepValid = {
    1: form.course_name.trim().length > 2 && form.faculty_id && form.prodi_id && form.lecturer_id && form.due_date,
    2: validVideos.length > 0,
    3: hasMainEditor && hasID,
    4: true,
  };

  const steps = [
    { n: 1, label: "Course details", sub: "What and who" },
    { n: 2, label: "Video plan", sub: "Episodes to produce" },
    { n: 3, label: "Team", sub: "Assign roles" },
    { n: 4, label: "Review", sub: "Confirm & request" },
  ];

  const addVideo = () => set("videos", [...form.videos, { id: Date.now(), title: "" }]);
  const updateVideo = (id, title) => set("videos", form.videos.map(v => v.id === id ? { ...v, title } : v));
  const removeVideo = (id) => set("videos", form.videos.filter(v => v.id !== id));
  const moveVideo = (id, dir) => {
    const idx = form.videos.findIndex(v => v.id === id);
    const ni = idx + dir;
    if (ni < 0 || ni >= form.videos.length) return;
    const copy = [...form.videos];
    [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
    set("videos", copy);
  };

  const toggleAssignment = (role, profile_id) => {
    const exists = form.assignments.find(a => a.role === role && a.profile_id === profile_id);
    if (exists) set("assignments", form.assignments.filter(a => a !== exists));
    else {
      // Single-role roles (ID, Main Editor, Sound) can have multiple? Keep flexible — for ID/Main Editor force single
      const single = ["Instructional Designer", "Main Editor / Videographer"];
      if (single.includes(role)) {
        set("assignments", [...form.assignments.filter(a => a.role !== role), { role, profile_id }]);
      } else {
        set("assignments", [...form.assignments, { role, profile_id }]);
      }
    }
  };

  const eligibleForRole = (role) => {
    if (role === "Instructional Designer") return PROFILES.filter(p => p.role === "Instructional Designer" || p.role === "Admin");
    return PROFILES.filter(p => p.role === "Digital Content Specialist");
  };

  return React.createElement("div", { style: { maxWidth: 1100, margin: "0 auto" } },
    // Breadcrumb
    React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 } },
      React.createElement("button", { className: "btn btn-ghost btn-sm", style: { padding: "2px 6px" }, onClick: onBack }, "Projects"),
      React.createElement("span", null, "/"),
      React.createElement("span", { style: { color: "var(--ink-2)" } }, "New project request")
    ),

    // Title
    React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 } },
      React.createElement("div", null,
        React.createElement("h1", { className: "section-h", style: { fontSize: 32, marginBottom: 4 } }, "Request a new project"),
        React.createElement("p", { className: "section-sub" }, "A project bundles a course's videos, the lecturer it belongs to, and the team producing it.")
      ),
      React.createElement("div", { style: { display: "flex", gap: 8, flexShrink: 0 } },
        React.createElement("button", { className: "btn btn-sm", onClick: onBack }, "Cancel"),
        React.createElement("button", { className: "btn btn-sm" }, "Save as draft")
      )
    ),

    React.createElement("div", { className: "new-project-grid", style: { display: "grid", gap: 20, alignItems: "flex-start" } },

      // Stepper rail
      React.createElement("aside", { className: "new-project-rail", style: { position: "sticky", top: 0 } },
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
          steps.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return React.createElement("button", {
              key: s.n,
              onClick: () => (done || s.n === step + 1 || stepValid[step]) ? setStep(s.n) : null,
              style: {
                display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px",
                background: active ? "var(--bg-elev)" : "transparent",
                border: `1px solid ${active ? "var(--line-strong)" : "transparent"}`,
                borderRadius: "var(--radius)",
                textAlign: "left", cursor: "pointer", width: "100%",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              },
            },
              React.createElement("div", {
                style: {
                  width: 26, height: 26, borderRadius: "50%",
                  background: done ? "var(--ink)" : active ? "var(--bg-soft)" : "var(--bg-soft)",
                  color: done ? "var(--bg-elev)" : active ? "var(--ink)" : "var(--ink-3)",
                  border: `1px solid ${done ? "var(--ink)" : active ? "var(--line-strong)" : "var(--line)"}`,
                  display: "grid", placeItems: "center",
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
                  flexShrink: 0,
                },
              }, done ? React.createElement(Icon, { name: "check", size: 12 }) : s.n),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--ink)" : "var(--ink-2)" } }, s.label),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 } }, s.sub)
              )
            );
          })
        ),
        React.createElement("hr", { className: "divider" }),
        React.createElement("div", { style: { padding: "0 12px", fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 } },
          React.createElement("div", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 500, marginBottom: 6 } }, "Tips"),
          "You can add or remove videos later. The Main Editor here becomes the default for every video — you can override per-video on the project page."
        )
      ),

      // Form
      React.createElement("section", { className: "card", style: { padding: 0 } },
        // Step content
        React.createElement("div", { style: { padding: "24px 28px" } },
          step === 1 && React.createElement(StepCourse, { form, set, FACULTIES, PRODI, LECTURERS, TERMS, prodiOptions }),
          step === 2 && React.createElement(StepVideos, { form, addVideo, updateVideo, removeVideo, moveVideo }),
          step === 3 && React.createElement(StepTeam, { form, toggleAssignment, eligibleForRole }),
          step === 4 && React.createElement(StepReview, { form, lecturer, faculty, prodi, term, validVideos, PROFILES })
        ),
        // Footer nav
        React.createElement("div", { style: { padding: "14px 24px", borderTop: "1px solid var(--line)", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" } },
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)" } }, `Step ${step} of 4`),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            step > 1 && React.createElement("button", { className: "btn btn-sm", onClick: () => setStep(step - 1) }, "Back"),
            step < 4 ?
              React.createElement("button", {
                className: "btn btn-primary btn-sm",
                disabled: !stepValid[step],
                style: { opacity: stepValid[step] ? 1 : 0.5, cursor: stepValid[step] ? "pointer" : "not-allowed" },
                onClick: () => stepValid[step] && setStep(step + 1),
              }, "Continue", React.createElement(Icon, { name: "arrow", size: 12 }))
              :
              React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => onCreated() }, React.createElement(Icon, { name: "check", size: 12 }), "Create project")
          )
        )
      ),

      // Live summary side
      React.createElement("div", { className: "new-project-side" },
        React.createElement(SummarySide, { form, lecturer, faculty, prodi, term, validVideos, PROFILES })
      )
    )
  );
}

// =================== STEP 1 ===================
function StepCourse({ form, set, FACULTIES, PRODI, LECTURERS, TERMS, prodiOptions }) {
  const { Icon } = window.DCS_LIB;
  return React.createElement("div", null,
    React.createElement(SectionHead, { title: "Course details", sub: "What course is this for, and when do you need it?" }),

    // Course name
    React.createElement(Field, { label: "Course name", required: true },
      React.createElement("input", {
        className: "input",
        style: { width: "100%", height: 42, fontSize: 15, fontFamily: "var(--font-display)", padding: "8px 12px" },
        placeholder: "e.g. Introduction to Microeconomics",
        value: form.course_name,
        onChange: e => set("course_name", e.target.value),
        autoFocus: true,
      })
    ),

    // Two columns: term + due date
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
      React.createElement(Field, { label: "Academic term", required: true },
        React.createElement("select", { className: "input", style: { width: "100%" }, value: form.term_id, onChange: e => set("term_id", Number(e.target.value)) },
          TERMS.map(t => React.createElement("option", { key: t.id, value: t.id }, t.name))
        )
      ),
      React.createElement(Field, { label: "Due date", required: true, hint: "When should the final cut be delivered?" },
        React.createElement("input", { type: "date", className: "input", style: { width: "100%" }, value: form.due_date, onChange: e => set("due_date", e.target.value), min: "2026-04-28" })
      )
    ),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
      React.createElement(Field, { label: "Faculty", required: true },
        React.createElement("select", { className: "input", style: { width: "100%" }, value: form.faculty_id || "", onChange: e => { set("faculty_id", Number(e.target.value)); set("prodi_id", null); } },
          React.createElement("option", { value: "" }, "Select faculty…"),
          FACULTIES.map(f => React.createElement("option", { key: f.id, value: f.id }, f.name))
        )
      ),
      React.createElement(Field, { label: "Study program (Prodi)", required: true },
        React.createElement("select", { className: "input", style: { width: "100%", opacity: form.faculty_id ? 1 : 0.5 }, disabled: !form.faculty_id, value: form.prodi_id || "", onChange: e => set("prodi_id", Number(e.target.value)) },
          React.createElement("option", { value: "" }, form.faculty_id ? "Select prodi…" : "Pick a faculty first"),
          prodiOptions.map(p => React.createElement("option", { key: p.id, value: p.id }, p.name))
        )
      )
    ),

    // Lecturer search/select
    React.createElement(Field, { label: "Lecturer", required: true, hint: "The instructor who will appear on camera. They'll receive the feedback link." },
      React.createElement(LecturerPicker, { value: form.lecturer_id, onChange: id => set("lecturer_id", id), LECTURERS })
    ),

    // Folder URL
    React.createElement(Field, { label: "Project folder URL", hint: "Optional Google Drive / SharePoint link for raw assets" },
      React.createElement("input", { className: "input", style: { width: "100%" }, placeholder: "https://drive.google.com/…", value: form.project_folder_url, onChange: e => set("project_folder_url", e.target.value) })
    ),

    // Notes
    React.createElement(Field, { label: "Notes for the team", hint: "Special considerations, formats, equipment needs, deadlines, etc." },
      React.createElement("textarea", { className: "input", style: { width: "100%", height: 90, padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }, placeholder: "Anything the team should know going in…", value: form.notes, onChange: e => set("notes", e.target.value) })
    )
  );
}

function LecturerPicker({ value, onChange, LECTURERS }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = LECTURERS.find(l => l.id === value);
  const filtered = LECTURERS.filter(l => l.name.toLowerCase().includes(q.toLowerCase()));
  return React.createElement("div", { ref, style: { position: "relative" } },
    React.createElement("button", {
      onClick: () => setOpen(o => !o),
      className: "input",
      style: { width: "100%", justifyContent: "space-between", height: 42, cursor: "pointer", display: "flex", alignItems: "center" },
    },
      React.createElement("span", { style: { color: selected ? "var(--ink)" : "var(--ink-3)" } }, selected ? selected.name : "Search lecturers…"),
      React.createElement(window.DCS_LIB.Icon, { name: "chevron", size: 14 })
    ),
    open && React.createElement("div", { style: { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-elev)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)", zIndex: 10, maxHeight: 280, overflow: "auto" } },
      React.createElement("input", { className: "input", style: { width: "100%", border: "none", borderBottom: "1px solid var(--line)", borderRadius: 0, height: 36 }, placeholder: "Type to filter…", value: q, onChange: e => setQ(e.target.value), autoFocus: true }),
      filtered.length === 0 && React.createElement("div", { style: { padding: 12, fontSize: 12.5, color: "var(--ink-3)" } }, "No lecturer matches. ", React.createElement("a", { href: "#", style: { color: "var(--accent)" } }, "Add a new lecturer →")),
      filtered.map(l => React.createElement("button", {
        key: l.id,
        onClick: () => { onChange(l.id); setOpen(false); setQ(""); },
        style: { width: "100%", padding: "8px 12px", background: l.id === value ? "var(--bg-soft)" : "transparent", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" },
      }, l.name, l.id === value && React.createElement(window.DCS_LIB.Icon, { name: "check", size: 14 })))
    )
  );
}

// =================== STEP 2 ===================
function StepVideos({ form, addVideo, updateVideo, removeVideo, moveVideo }) {
  const { Icon } = window.DCS_LIB;
  const suggestions = [
    "01 — Course Overview & Learning Goals",
    "02 — Foundational Concepts",
    "03 — Worked Example",
    "04 — Case Study",
    "05 — Wrap-up & Assessment Prep",
  ];
  return React.createElement("div", null,
    React.createElement(SectionHead, { title: "Plan the videos", sub: "List the episodes you'll need. You can rename, reorder, or add more anytime later." }),

    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
      form.videos.map((v, i) =>
        React.createElement("div", {
          key: v.id,
          style: { display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-elev)" },
        },
          React.createElement("div", { className: "tabular", style: { fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink-3)", fontWeight: 500, textAlign: "center" } }, String(i + 1).padStart(2, "0")),
          React.createElement("input", {
            className: "input",
            style: { border: "none", background: "transparent", padding: 0, height: "auto", fontSize: 14 },
            placeholder: `Video ${i + 1} title — e.g. "Introduction to ${form.course_name || "the topic"}"`,
            value: v.title,
            onChange: e => updateVideo(v.id, e.target.value),
          }),
          React.createElement("div", { style: { display: "flex", gap: 2 } },
            React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "Move up", onClick: () => moveVideo(v.id, -1), disabled: i === 0, style: { opacity: i === 0 ? 0.3 : 1 } },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M10 16V4m-4 4l4-4 4 4" }))
            ),
            React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "Move down", onClick: () => moveVideo(v.id, 1), disabled: i === form.videos.length - 1, style: { opacity: i === form.videos.length - 1 ? 0.3 : 1 } },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M10 4v12m-4-4l4 4 4-4" }))
            ),
            React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "Remove", onClick: () => removeVideo(v.id), disabled: form.videos.length === 1, style: { opacity: form.videos.length === 1 ? 0.3 : 1, color: "var(--s-cancelled)" } },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 5l10 10M15 5L5 15" }))
            )
          )
        )
      )
    ),

    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginTop: 16 } },
      React.createElement("button", { className: "btn btn-sm", onClick: addVideo },
        React.createElement(Icon, { name: "plus", size: 12 }), "Add video"
      ),
      React.createElement("button", { className: "btn btn-sm", onClick: () => suggestions.forEach(s => { addVideo(); }), style: { opacity: 0.7 } }, "Use a 5-video template")
    ),

    React.createElement("hr", { className: "divider" }),

    React.createElement("div", { style: { padding: "14px 16px", background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: "var(--radius)", display: "flex", gap: 12, alignItems: "flex-start" } },
      React.createElement("div", { style: { width: 32, height: 32, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: "play", size: 14 })
      ),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 13, fontWeight: 500, marginBottom: 2 } }, "All videos start as Requested"),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 } }, "After the project is created, the team will move each video through the production pipeline: Scheduled → Audio Editing → Video Editing → Review → Done.")
      )
    )
  );
}

// =================== STEP 3 ===================
function StepTeam({ form, toggleAssignment, eligibleForRole }) {
  const { Avatar, RoleChip, Icon } = window.DCS_LIB;
  const roles = [
    { name: "Instructional Designer", required: true, single: true, hint: "Owns the project end-to-end." },
    { name: "Main Editor / Videographer", required: true, single: true, hint: "Becomes the default editor for every video. Auto-syncs to videos.main_editor_id." },
    { name: "Assistant Editor", single: false, hint: "Optional support on edits." },
    { name: "Assistant Videographer", single: false, hint: "Optional support on shoot day." },
    { name: "Sound Engineer", single: false, hint: "Optional, for music-or-VO-heavy projects." },
  ];
  return React.createElement("div", null,
    React.createElement(SectionHead, { title: "Assign the team", sub: "Pick the people who'll work on this project. You can change assignments anytime." }),

    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } },
      roles.map(r => {
        const eligible = eligibleForRole(r.name);
        const assigned = form.assignments.filter(a => a.role === r.name).map(a => a.profile_id);
        return React.createElement("div", { key: r.name },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 500 } }, r.name),
            r.required && React.createElement("span", { style: { fontSize: 10.5, padding: "1px 5px", borderRadius: 3, background: "var(--s-cancelled-bg)", color: "var(--s-cancelled)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Required"),
            r.single && React.createElement("span", { style: { fontSize: 10.5, padding: "1px 5px", borderRadius: 3, background: "var(--bg-sunken)", color: "var(--ink-3)" } }, "single pick"),
            React.createElement("div", { style: { flex: 1 } }),
            assigned.length > 0 && React.createElement("span", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, `${assigned.length} selected`)
          ),
          React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginBottom: 10 } }, r.hint),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 } },
            eligible.map(p => {
              const sel = assigned.includes(p.id);
              return React.createElement("button", {
                key: p.id,
                onClick: () => toggleAssignment(r.name, p.id),
                style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${sel ? "var(--ink)" : "var(--line)"}`, background: sel ? "var(--bg-elev)" : "var(--bg-soft)", borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left", boxShadow: sel ? "var(--shadow-sm)" : "none", transition: "all 0.1s" },
              },
                React.createElement(Avatar, { profile: p, size: 28 }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, p.full_name),
                  React.createElement("div", { style: { fontSize: 10.5, color: "var(--ink-3)" } }, p.role.split(" ").map(w => w[0]).join(""))
                ),
                sel && React.createElement("div", { style: { width: 18, height: 18, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-elev)", display: "grid", placeItems: "center" } },
                  React.createElement(Icon, { name: "check", size: 11 })
                )
              );
            })
          )
        );
      })
    )
  );
}

// =================== STEP 4 ===================
function StepReview({ form, lecturer, faculty, prodi, term, validVideos, PROFILES }) {
  const { Avatar, RoleChip, fmtDateShort } = window.DCS_LIB;
  return React.createElement("div", null,
    React.createElement(SectionHead, { title: "Review and request", sub: "Double-check the details below. The team will be notified once you create the project." }),

    React.createElement("div", { style: { padding: "20px 22px", background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", marginBottom: 18 } },
      React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", marginBottom: 6 } }, form.course_name || "Untitled course"),
      React.createElement("div", { style: { fontSize: 13, color: "var(--ink-2)" } }, [lecturer?.name, prodi?.name, faculty?.name].filter(Boolean).join(" · ")),
      React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: "var(--ink-3)" } },
        React.createElement("span", null, "Term: ", React.createElement("span", { style: { color: "var(--ink-2)", fontWeight: 500 } }, term?.name || "—")),
        React.createElement("span", null, "Due: ", React.createElement("span", { style: { color: "var(--ink-2)", fontWeight: 500 } }, fmtDateShort(form.due_date) || "—")),
        React.createElement("span", null, "Videos: ", React.createElement("span", { style: { color: "var(--ink-2)", fontWeight: 500 } }, validVideos.length))
      )
    ),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 } },
      React.createElement(ReviewCard, { title: `Videos (${validVideos.length})` },
        React.createElement("ol", { style: { margin: 0, padding: "0 0 0 0", listStyle: "none" } },
          validVideos.map((v, i) =>
            React.createElement("li", { key: v.id, style: { display: "flex", gap: 10, padding: "6px 0", fontSize: 13 } },
              React.createElement("span", { className: "tabular muted", style: { width: 24 } }, String(i + 1).padStart(2, "0")),
              React.createElement("span", null, v.title)
            )
          )
        )
      ),
      React.createElement(ReviewCard, { title: `Team (${form.assignments.length})` },
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          form.assignments.map((a, i) => {
            const p = PROFILES.find(x => x.id === a.profile_id);
            return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10 } },
              React.createElement(Avatar, { profile: p, size: 26 }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontSize: 12.5, fontWeight: 500 } }, p?.full_name),
                React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)" } }, a.role)
              )
            );
          })
        )
      )
    ),

    form.notes && React.createElement(ReviewCard, { title: "Notes", marginTop: 0 },
      React.createElement("div", { style: { fontSize: 13, color: "var(--ink-2)", whiteSpace: "pre-wrap", lineHeight: 1.6 } }, form.notes)
    )
  );
}

// =================== Side summary ===================
function SummarySide({ form, lecturer, faculty, prodi, term, validVideos, PROFILES }) {
  const { Avatar, RoleChip } = window.DCS_LIB;
  const filledCount =
    (form.course_name ? 1 : 0) +
    (form.faculty_id ? 1 : 0) +
    (form.prodi_id ? 1 : 0) +
    (form.lecturer_id ? 1 : 0) +
    (form.due_date ? 1 : 0) +
    (validVideos.length > 0 ? 1 : 0) +
    (form.assignments.some(a => a.role === "Instructional Designer") ? 1 : 0) +
    (form.assignments.some(a => a.role === "Main Editor / Videographer") ? 1 : 0);
  const completion = Math.round((filledCount / 8) * 100);

  return React.createElement("aside", { style: { position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 12 } },
    React.createElement("div", { className: "card", style: { padding: 16 } },
      React.createElement("div", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 500, marginBottom: 8 } }, "Live preview"),

      React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.01em", color: form.course_name ? "var(--ink)" : "var(--ink-3)", marginBottom: 6 } },
        form.course_name || "Untitled course"
      ),
      React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginBottom: 14 } },
        [lecturer?.name, prodi?.name].filter(Boolean).join(" · ") || "Lecturer & program will appear here"
      ),

      React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14 } },
        React.createElement("span", { className: "chip chip-Requested" },
          React.createElement("span", { className: "chip-dot" }),
          "Requested"
        ),
        term && React.createElement("span", { style: { fontSize: 11, color: "var(--ink-3)", padding: "3px 0" } }, term.name)
      ),

      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12, borderTop: "1px solid var(--line)" } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3, fontWeight: 500 } }, "Videos"),
          React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 } }, validVideos.length)
        ),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3, fontWeight: 500 } }, "Due"),
          React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500 } }, form.due_date ? new Date(form.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—")
        )
      ),

      form.assignments.length > 0 && React.createElement("div", { style: { paddingTop: 12, marginTop: 12, borderTop: "1px solid var(--line)" } },
        React.createElement("div", { style: { fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 } }, "Team"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          form.assignments.map((a, i) => {
            const p = PROFILES.find(x => x.id === a.profile_id);
            return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8 } },
              React.createElement(Avatar, { profile: p, size: 22 }),
              React.createElement("div", { style: { fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p?.full_name),
              React.createElement("span", { style: { fontSize: 10, color: "var(--ink-3)" } }, a.role.split(" / ")[0].split(" ").slice(-1)[0])
            );
          })
        )
      )
    ),

    React.createElement("div", { className: "card", style: { padding: 14 } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
        React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 } }, "Completion"),
        React.createElement("div", { className: "tabular", style: { fontSize: 12, fontWeight: 600 } }, `${completion}%`)
      ),
      React.createElement("div", { style: { height: 6, borderRadius: 3, background: "var(--bg-sunken)", overflow: "hidden" } },
        React.createElement("div", { style: { width: `${completion}%`, height: "100%", background: completion === 100 ? "var(--s-done)" : "var(--ink)", transition: "width 0.4s" } })
      )
    )
  );
}

// =================== Bits ===================
function SectionHead({ title, sub }) {
  return React.createElement("div", { style: { marginBottom: 18 } },
    React.createElement("h3", { style: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em", margin: 0, color: "var(--ink)" } }, title),
    sub && React.createElement("p", { style: { fontSize: 13, color: "var(--ink-3)", margin: "4px 0 0 0" } }, sub)
  );
}

function Field({ label, hint, required, children }) {
  return React.createElement("div", { style: { marginBottom: 16 } },
    React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6 } },
      label,
      required && React.createElement("span", { style: { color: "var(--s-cancelled)", fontSize: 12 } }, "*")
    ),
    children,
    hint && React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5 } }, hint)
  );
}

function ReviewCard({ title, children }) {
  return React.createElement("div", { className: "card", style: { padding: 16 } },
    React.createElement("div", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 500, marginBottom: 10 } }, title),
    children
  );
}

window.DCS_NEW_PROJECT = NewProject;
