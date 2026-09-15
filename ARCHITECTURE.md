# Architecture

How this app is put together, and why it is shaped the way it is.

**This document is the map. [`AI_README.md`](AI_README.md) is the contract.** They have different jobs:

- `AI_README.md` states the **rules you must not break**, tersely, in numbered sections. Code comments across the app cite them as `§8`, `§11`, `§16`. When a rule and this document disagree, `AI_README.md` wins and this document is wrong.
- This file explains the **system** — the domain, the lifecycle, where things live, which decisions are load-bearing and which are arbitrary.

Read this first if you are new. Read `AI_README.md` before changing anything that touches attribution, dates, or the reports.

---

## 1. What this app is

The **DCS Project Tracker** is an internal tool for UPH's Centre for Teaching & Learning. Lecturers request video production for their courses; a small team designs, films, edits and delivers those videos; the lecturer reviews and approves them and fills in a satisfaction form at the end.

The app tracks that pipeline and reports on it. It is production-active with a real team using it daily, so *"preserve current functionality"* is a genuine constraint, not boilerplate.

Three global roles (`profiles.role`):

| Role | What they do |
|---|---|
| **Admin** | Everything, plus `/admin/users` — approving new accounts and assigning roles |
| **Instructional Designer** | Shapes the course with the lecturer, manages projects, terms and assignments |
| **Digital Content Specialist** | The editors, videographers and sound engineers who make the videos |

A person's **global role** says what they can *access*. Their **project assignment role** says what they *did* on a given project. The two are separate and a person can hold several assignment roles across different projects — see §3.

---

## 2. The domain model

```
academic_year ──< term ──< project ──< video
                              │
                              ├──< project_assignments   (who worked on it, in what role)
                              ├──< feedback_submission   (one form per project, from the lecturer)
                              └──  lecturers, prodi ──> faculties
                                             video ──< video_feedback_log  (one row per event)
                                                    ──< due_date_changes   (one row per reschedule)
```

**`academic_year`** groups terms. Exactly one is active at a time, enforced by a partial unique index (`academic_years_one_active`). The active year is the default scope for the dashboard, analytics and reports.

**`term`** is a teaching term such as `1251`. Its first three digits encode the year (`125` → 2025/2026), which is how terms were originally backfilled into years. **A term says which term a course is *for*, not when the work happened** — a project for 1261 can be produced during 1252. This distinction drives a lot of the scoping logic; see §13 of `AI_README.md`.

**`project`** is one course's video production job. It belongs to a term, a lecturer and a prodi (study programme), which in turn belongs to a faculty.

**`video`** is a single deliverable. This is the unit the team actually works in, and the unit editing credit attaches to.

**`feedback_submission`** is the lecturer's end-of-project survey, reached through a public slug URL. One per project. Its presence is *also* a completion signal — see §4.

**`video_feedback_log`** records events on a video: `Approved`, `Ready for Review`, `Revision Requested`. Only `Revision Requested` rows are revisions; counting all of them once inflated the revision rate roughly fivefold.

**`due_date_changes`** records every deadline reschedule, written by database triggers and never by application code.

---

## 3. The two credit systems

**This is the single most important concept in the app.** Nearly every reporting bug in its history traces back to conflating these.

### Editing credit is per video

`videos.main_editor_id` is the **single source of truth** for who edited a video. Not the project assignment — the video's own column.

- When a project's **Main Editor / Videographer** is assigned, that person is *seeded* onto every video in the project that has **no editor yet**.
- Adding a video later seeds it from the project's earliest Main Editor assignment.
- Changing one video's editor moves **only that video's** credit. The project assignment is untouched.

The safety property that makes this work is one clause in `assignTeamMember` (`src/app/projects/[id]/actions.ts`):

```ts
if (!reassignAll) {
  updateVideos = updateVideos.is('main_editor_id', null);
}
```

A video that already names someone is an override — that person did the editing and keeps the credit. Removing that `.is(...)` narrowing would silently rewrite history across a whole project. There is a deliberate escape hatch (`reassign_all`, a checkbox in the confirmation dialog) for genuine hand-overs, and it defaults to off so that even a direct POST degrades to the safe path.

Two client-side confirmation dialogs guard this too — one in `VideoEditForm.tsx` for changing a single video's editor, one in `AssignedTeam.tsx` for assigning the Main Editor role. Both use a **re-entry guard**: the dialog re-submits the same form, and an early-return (`if (pendingAssign) return`, and the deliberately un-reset `showEditorConfirm`) is what lets the second pass through. These look like redundant state and are not. Do not "clean them up".

### Every other role is per project

Sound Engineers, Instructional Designers and Assistant Editors/Videographers have **no per-video column**. They are credited with every video in the projects they are assigned to.

### The consequence: never sum the two

Both systems describe the **same videos** from two angles. On the 2025/2026 data, the editors account for 262 completed videos between them — and the single Sound Engineer is credited with 236 of those same videos. Adding the two gives a number that means nothing.

The reports keep them in separate sections for exactly this reason, and `projectRoleCredit()` takes the **union of projects** when several roles are merged into one group, rather than summing per-role results — otherwise somebody who is both Assistant Editor and Assistant Videographer on one project has that project counted twice.

---

## 4. The lifecycle of a project

```
Requested → Scheduled for Taping → Audio Editing → Video Editing → Review → Done
                                                                      ↑        │
                                                            Revision Requested ┘
```

Those six are the **video** statuses (`VideoEditForm.tsx`). Projects carry a smaller set: `Active` (the common live value), `Done`, `Pending`, `Cancelled`.

Two words that are **not** synonyms (`AI_README.md` §15):

- **Delivered** — the video first reached the lecturer, i.e. its status first became `Review`. Stamped in `videos.delivered_at`.
- **Completed** — the lecturer approved it, `status = 'Done'`.

A video is delivered and *then* sits in review, sometimes for weeks. Using one word for both makes the on-time rate irreconcilable with the dashboard.

**A project is complete when `status = 'Done'` OR a `feedback_submission` exists.** The second half matters: a lecturer who fills in the survey has finished with the project regardless of what the status column says. `isProjectCompleted()` in `src/lib/reports/metrics.ts` is the one implementation — see §7 below for why that matters.

### Two database triggers do work the app relies on

Both live in `db_schema_ontime_delivery.sql` and are triggers rather than application code **on purpose**: several code paths move a video into Review, and an earlier attempt to stamp it in one server action covered 1 video out of 393.

- **`stamp_video_delivered_at`** sets `delivered_at` on the *first* transition into `Review`. It requires a genuine `OLD.status IS DISTINCT FROM NEW.status` transition, because `updateVideo()` always includes `status` in its SET list and would otherwise invent a delivery date on every unrelated edit. Re-delivery after a revision must not overwrite it.
- **`log_project_due_date_change`** / **`log_video_due_date_change`** write `due_date_changes`. There is deliberately **no INSERT policy** on that table — rows come only from the `SECURITY DEFINER` triggers.

Videos that reached Review before these triggers existed keep `delivered_at = NULL` **forever**. They are reported as *not tracked*, never as on time. Delivery dates begin from July 2026.

---

## 5. Data flow and auth

**Server Components read. Server Actions write.** There are no API routes except one deliberate exception: `/api/analytics/export` returns a CSV file, which a Server Action cannot do. `AI_README.md` §7 permits this ("unless creating webhooks" — a file download is the same category of exception).

### Four Supabase clients, and when to use each

| Client | Used in | Notes |
|---|---|---|
| `src/lib/supabase/server.ts` | Server Components, Server Actions | The default. Respects Row Level Security as the signed-in user. |
| `src/lib/supabase/client.ts` | Client Components | Browser-side, anon key. |
| `src/lib/supabase/middleware.ts` | `src/middleware.ts` only | Refreshes the auth cookie on each page request. |
| `src/lib/supabase/service.ts` | **`src/app/feedback/[slug]/actions.ts` and nowhere else** | Service role key — **bypasses RLS entirely**. |

The service client is confined to the feedback flow because lecturers are **not** users of this app: they arrive at a public `/feedback/<slug>` URL with no account, so no RLS policy can authorise their writes. Spreading this client anywhere else removes row-level security from that code path. `AI_README.md` §10 states this as a rule; the confinement is currently real and verifiable with `grep -rn "createServiceClient" src/`.

### Middleware

`src/middleware.ts` guards every page: unauthenticated users go to `/login`; users with a profile but no role go to `/pending-approval`; users with no name go to `/onboarding`; `/admin/users` is Admin-only.

Its matcher excludes all of `_next` and anything with a static file extension. This is not micro-optimisation — every request reaching the middleware costs a `getUser()` round-trip to the Supabase auth server **plus** a `profiles` query. An earlier matcher let `/_next/webpack-hmr` through, which polls continuously in development, and that exhausted the auth rate limit and started bouncing real page loads to `/login` with a 429.

---

## 6. Directory map

```
src/
├── app/
│   ├── page.tsx, DashboardStats, NeedsAttention, DashboardFilters, StatusTabsClient
│   │                          the dashboard: triage + the project table
│   ├── analytics/            charts and trends (17 files) — exploration, not documents
│   ├── reports/              printable A4 documents: per-member and team
│   ├── my-projects/          one person's work                    ← not yet rebuilt
│   ├── workload/             capacity planning                    ← not yet rebuilt
│   ├── projects/
│   │   ├── [id]/             the main working screen (9 files)    ← not yet rebuilt
│   │   ├── new/              intake form
│   │   └── data-table/       the shared project table (DataTable + columns + ExpandedRow)
│   ├── admin/                master data + user approval          ← not yet rebuilt
│   ├── feedback/[slug]/      PUBLIC — the lecturer's survey, service-role client
│   ├── quality/              the team's quality standard, static
│   ├── login/, onboarding/, pending-approval/, auth/callback/
│   └── api/analytics/export/ the one API route (CSV download)
│
├── components/
│   ├── insight/              the design system — see §8
│   ├── ui/                   shadcn primitives (19 files), unmodified
│   ├── Sidebar, MobileHeader, CheckboxFilter, Pagination, ConfirmationModal
│   └── AdminSidebar          (a separate, older design — see §11)
│
└── lib/
    ├── dates.ts, roles.ts, nav.ts, academic-year.ts, constants.ts, types.ts, utils.ts
    ├── reports/metrics.ts    every reportable figure, once
    └── supabase/             the four clients above
```

Root: `AI_README.md` (rules), this file, `CLAUDE.md` (working agreements), and the `db_*.sql` migrations. The SQL files are **idempotent and hand-run** — there is no migration runner. Applying one is a manual step, and code that depends on a new table must degrade gracefully if it has not been applied (`getYearScope` checks for error codes `42P01`/`42703` and returns a no-op scope).

---

## 7. The shared layer — and what must never be re-inlined

Everything below exists because it was previously written two or more times and the copies drifted. The **symptom** column is what you will actually see when someone re-implements one.

| Module | Owns | Symptom when re-implemented |
|---|---|---|
| `lib/reports/metrics.ts` | Every reportable figure: completion, punctuality, editor and project-role credit, completeness, satisfaction | Two pages state different numbers for the same thing. `/workload` currently does exactly this — it cannot evaluate the feedback half of the completion rule, so it treats projects the dashboard calls finished as live work. |
| `lib/dates.ts` | `parseDbDate`, `formatDate`, `deadlineFor`, `deadlineTone`, `deadlineLabel`, `daysUntil/Since` | Two date formats on one screen (`27/07/2026` vs `27 Jul 2026`), and off-by-one dates from parsing `YYYY-MM-DD` without the `T00:00:00` timezone fix. |
| `lib/roles.ts` | `roleTheme`, `groupedProfiles`, `memberOptions` | The role colours drift between pages, and null-role profiles get silently folded into "Admins" instead of "Awaiting a role". |
| `lib/academic-year.ts` | `getYearScope`, `inActiveYear`, `outOfYearTerm`, `shouldScopeToYear` | Terms matched by year *name* instead of id; out-of-year pills stop rendering. |
| `lib/nav.ts` | `NAV_ITEMS`, `pageTitle`, `hidesAppChrome` | A page renamed in the sidebar keeps its old name in the mobile header. |
| `components/insight/StatusBadge.tsx` | The one status→colour map | `Video Editing` renders blue in one table and purple in another. This happened; the map used to exist in four places. |

**`deadlineFor(video, project)` deserves a special mention.** The rule is *a video's own `due_date`, else the project's*. Never re-inline the `?? project.due_date` fallback — the moment two places implement it, the on-time table and the deadline-risk card disagree and there is no way to tell which is right.

### Columns that do not exist

`videos.updated_at` and `projects.updated_at` **do not exist**. `projects.approval_date` exists but is always NULL. Code has been written against all three. See `AI_README.md` §11 for the full list of what is real.

---

## 8. The design system — `src/components/insight/`

### `tokens.ts` — colour with meaning

- **`SERIES`** — categorical identity, assigned in slot order and **never cycled**; a ninth series folds into "Other" rather than repeating a colour. The order was validated for colour-vision-deficiency separation.
- **`BLUE_RAMP`** — sequential magnitude, light to dark.
- **`STATUS`** — state (`good`/`warning`/`serious`/`critical`), always paired with a label or icon, never colour alone.
- **`INK`** — text and chrome. Labels never wear a series colour; a swatch beside them carries identity.

**On the printed reports, `SERIES[0]` means *completed* and `SERIES[1]` means *in production* for the whole sheet**, so categorical colours (faculties) start at `SERIES[2]`. A faculty wearing blue would make one legend contradict another three centimetres below it. `buildFacultyColours()` assigns one map per sheet, biggest first.

### `primitives.tsx`

`ChartCard` (a titled panel with optional coverage badge and footnote), `StatTile` (a figure with optional meter, sparkline, secondary value and tone), `EmptyState`, `Legend`, `Sparkline`, `ShareBar`, `InfoNote` (the ⓘ tooltip), `SectionHeading`.

`InfoNote` is the answer to "this caveat is true but too long for the card". Put the short form on screen and the full explanation behind the ⓘ — see `AI_README.md` §14 for which slot a given sentence belongs in.

### Charts

Recharts on screen; **plain CSS and inline SVG on paper**. A `ResponsiveContainer` measures the viewport, which has no meaning in print and renders unpredictably. The report bars are divs that measure themselves against the page.

---

## 9. UI state conventions

### The URL is the state

Filters live in `searchParams`, not React state, so a filtered view is linkable and survives a refresh. Server Components read them directly.

### Absent is not the same as empty

**This distinction has broken the dashboard twice.** For a param that has a default:

- **missing** (`?`) → nobody has chosen; apply the default (the active academic year)
- **present but empty** (`?term=`) → the reader deliberately cleared it; show every year

Collapsing the two means an unrelated change — picking a faculty — writes `term=''` and silently drops the year scope. The opposite failure is just as bad: seeding the draft with the year's term ids made an unrelated change *commit* those terms for real, hiding live work from other years on a dashboard whose whole point is that it must not be strict. The current implementation tracks a `termTouched` flag on the client precisely to keep the two apart.

### Draft state, committed on close

Filter dropdowns hold a **draft**; the URL stays the applied truth. Closing a dropdown commits. Without this, ticking three terms fires three navigations, each discarding the last.

### The stale veil

`components/insight/FilterStatus.tsx` shares the toolbar's state with the content below it. When a refetch is in flight (`isPending`) or a change is uncommitted (`isDirty`), the content blurs and dims and a floating caption says which. The toolbar itself stays outside the veil — **the way out of a stale view must never be behind the blur that announces it** — and the veil force-disables itself under `@media print`.

Render `StaleBanner` **once** per page and `StaleContent` around as many regions as needed.

### Honesty about unknowns

A recurring rule across the app: **never present an unmeasured value as a measured one.** Videos with no `delivered_at` are reported as "not tracked", never as on time. A project with no feedback form is not a low score, it is no score. A tick box nobody ticked cannot be distinguished from a thing that did not happen, and the label says so ("marked as having an English subtitle", not "with"). An earlier version of the analytics reported a confident 11% team punctuality figure that meant nothing.

---

## 10. Print

`/reports` produces A4 PDFs through the **browser's own print dialog**. No headless Chrome: it would need `@sparticuz/chromium` to run on Vercel, and rasterising would cost the selectable, searchable text that makes a filed report useful.

The whole print contract is in `src/app/globals.css`:

| Hook | Purpose |
|---|---|
| `.app-shell` / `.app-scroll` | Class names on the layout that exist **only** so `@media print` can unwind the app shell. The layout is `h-screen overflow-hidden` around an `overflow-y-auto` column — correct on screen, but on paper it clips the document to one viewport and prints the scrollbar track. Do not remove these class names. |
| `.report-page` | One sheet. `.report-page + .report-page` starts a new page. |
| `.report-block` | Must not be split across a fold — moves whole to the next page. |
| `.report-row` | One row of a repeating list; the list may span a fold, a row may not. |
| `.report-keep-with-next` | Glues a heading to its content. |

Backgrounds are stripped by browsers in print by default, so `print-color-adjust: exact` is forced globally — without it every status pill, meter and tinted chip loses its fill.

Content that overflows a sheet is **paginated explicitly** rather than left to flow, because the footer numbers each `report-page`: a section that spilled onto a second piece of paper would print "Sheet 4 of 4" at the foot of the fifth.

---

## 11. Known debt

*Last verified against the code: 28 July 2026.*

Three pages were rebuilt on the shared layer (`/`, `/analytics`, `/reports`). Four were not, and the gap has widened.

**`/my-projects`** — finds work through `project_assignments` **only**, contradicting §3 above. A per-video editor override on a project the person is not assigned to never appears on their own page, so their "My Projects" and their own report disagree about what they worked on. Overrides happen occasionally, not daily. Also: no filters, no search, no pagination, no year scope (so `OutOfYearPill` is permanently dead there), and it carries a private copy of the completion rule.

**`/workload`** — drops everyone with no ongoing projects, so the one question it exists to answer ("who has room?") is unanswerable. `feedback_submission` is absent from its query, so it cannot apply the completion rule and genuinely disagrees with the dashboard. Private role-colour map, two private date implementations, and a project with zero videos is permanently "ongoing".

**`/projects/[id]`** — no status, deadline, progress or breadcrumb in the header; always links back to `/` regardless of where you came from. The effective deadline and `delivered_at` are fetched and never rendered. `due_date_changes` is written on every reschedule and its rows are read nowhere. A failed save closes the form and toasts "Project details saved". Every page load runs a whole-table query across all profiles × assignments × projects × videos to populate one dropdown hint.

**`/admin`** — no adoption of the shared layer at all. `AdminSidebar` is a fixed 256px `flex-shrink-0` aside with no responsive treatment, inside a second `flex h-screen` nested in the app shell: on a 375px phone that leaves roughly 7px of content width, plus two nested scrollers. The landing page shows no counts. Pending approvals are a corner badge whose card description is identical whether nobody or twelve people are waiting.

**Repo-wide** — one real lint error (`admin/lecturers/actions.ts`, `prevState: State | any`); a single root `loading.tsx` that draws the *dashboard's* skeleton over every route without its own; no `error.tsx` or `not-found.tsx` anywhere; and dead files (`admin/faculties/FacultyList.tsx`, `admin/users/UserList.tsx`, `projects/[id]/FeedbackResults.tsx`).

---

## 12. Adding a new page

1. **Numbers come from `lib/reports/metrics.ts`.** If the figure you need is not there, add it there — not in the page.
2. **Dates come from `lib/dates.ts`.** Especially `deadlineFor`.
3. **Scope by academic year** with `getYearScope`, and respect the absent-vs-empty rule for the `term` param.
4. **Build from `components/insight/`** — `ChartCard`, `StatTile`, `EmptyState`. Do not hand-roll a card.
5. **Status pills are `StatusBadge`.** Role colours are `roleTheme`. Never a local map.
6. **Filters** are `CheckboxFilter` (it has a `mode="single"` variant), driven by `searchParams`, with draft state committed on close and wrapped in `FilterStatusProvider` + `StaleContent`.
7. **Write a real `EmptyState`** — say what would appear here and why nothing does.
8. **Handle the error path.** Do not `return <p>Error: {error.message}</p>` — that leaks the database's words to a user who cannot act on them.
9. **Add the route to `lib/nav.ts`** so the mobile header can name it.
10. **Check it at 375px** before calling it done.
11. Run `npx tsc --noEmit`, `npx eslint <paths>` and `npm run build`.
