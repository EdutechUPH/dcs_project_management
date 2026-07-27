# DCS Project Tracker - AI Architecture & Design Guide

This document provides a comprehensive overview of the **DCS Project Tracker**, serving as context for any AI assistant working on this codebase. It outlines the technology stack, application structure, database schema, data flow, and design conventions.

## 1. Technology Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router, Version 15/16+)
- **UI & Styling:** React 19, Tailwind CSS v4, `tailwindcss-animate`
- **Components:** Radix UI primitives, `lucide-react` (icons), `recharts` (charts), `@tanstack/react-table` (tables), `date-fns` & `react-day-picker` (dates), `sonner` (notifications)
- **Database & Auth:** Supabase and `@supabase/ssr`

## 2. Project Structure & Dashboards
The application uses the Next.js App Router paradigm. Below are the primary dashboards and routes:

- **`/` (Home/Landing):** Main dashboard displaying recent projects, quick stats, or landing content.
- **`/admin`:** Master dashboards for administrative tasks. Sub-routes exist for managing:
  - Users (`/admin/users`) and approval processes.
  - Faculties (`/admin/faculties`), Prodi/Study Programs (`/admin/prodi`), and Lecturers (`/admin/lecturers`).
  - Academic Terms (`/admin/terms`).
- **`/analytics`:** Provides charts and key metrics across three tabs (see §12 for the shared chart system):
  - **Delivery & Flow:** KPI tiles (videos delivered + sparkline, runtime produced, median cycle time, pipeline size, satisfaction), Production Pipeline (videos by workflow stage), Deadline Risk (unfinished videos bucketed by deadline proximity + the most overdue projects), weekly completion trend with a 4-week moving average, and one stacked Delivery-by-grouping chart.
  - **Team Performance:** Capacity tiles (active assignments, runtime delivered, busiest editor's share), runtime-per-editor chart, Editor Scorecard, Sound Engineer coverage, On-Time Delivery.
  - **Quality & Feedback:** Revision stats (first-pass approval, revision rounds, rounds per revised video from `video_feedback_log`), category scores against the overall mean, satisfaction trend.
- **`/auth` & `/login`:** Authentication flows, callbacks, and login interfaces.
- **`/feedback/[slug]`:** Public or client-facing portals where reviewers can leave feedback based on automatically generated unique slugs.
- **`/my-projects`:** Personalized dashboard for editors to see only projects they are assigned to.
- **`/onboarding`:** Initial profile setup for new or recently approved users.
- **`/pending-approval`:** Dashboard tracking videos or projects in a specific 'Pending Approval' workflow state.
- **`/projects`:** Detailed views (`/projects/[id]`) and lists of all projects. Includes functions to add videos, assign team members, and request feedback.
- **`/workload`:** Tracks editor workloads, showing active project/video counts to aid in resource allocation.

## 3. User Roles
The application employs two levels of roles: global application profile roles and project-specific assignment roles.

### Global Profile Roles
- **`Admin`:** Has full access to `/admin` routes to manage master data, approve users, and alter global settings.
- **`Instructional Designer`:** Can manage projects, terms, and assignments.
- **`Digital Content Specialist`:** Typically the editors and videographers managing the actual video deliverables.

### Project Assignment Roles (from `PROJECT_ROLES`)
When a user is assigned to a specific project (`project_assignments` table), they are granted one of the following roles:
- `Instructional Designer`
- `Main Editor / Videographer`
- `Assistant Editor`
- `Assistant Videographer`
- `Sound Engineer`

## 4. Detailed Data Structures
The core PostgreSQL database (Supabase) maps precisely to types found in `src/lib/types.ts`. 

### Supabase Enums
- **`team_member_role`**: Instructional Designer, Digital Content Specialist
- **`project_status`** *(Used for Projects & Videos)*: Requested, Scheduled for Taping, Audio Editing, Video Editing, Review, Done, Pending, Cancelled
- **`project_assignment_role`**: Main Editor / Videographer, Assistant Editor, Assistant Videographer, Sound Engineer, Instructional Designer
- **`user_role`**: Admin, Instructional Designer, Digital Content Specialist

Key interfaces include:

```typescript
export interface Profile {
  id: string; // Maps to Supabase Auth User ID
  full_name: string;
  role: 'Admin' | 'Instructional Designer' | 'Digital Content Specialist';
  email?: string;
  project_assignments?: Assignment[];
}

export interface Project {
  id: number;
  created_at: string;
  course_name: string;
  due_date: string;
  notes: string | null;
  term_id: number;
  faculty_id: number;
  prodi_id: number;
  lecturer_id: number;
  status?: string; // e.g. 'Active', 'Done'
  project_folder_url?: string | null;
  // Relations
  videos: Video[];
  project_assignments: Assignment[];
  feedback_submission: FeedbackSubmission | null;
  lecturers: { name: string } | null;
  prodi: { name: string, faculties?: { name: string } | null } | null;
  terms: { name: string } | null;
}

export interface Video {
  id: number;
  project_id: number;
  title: string;
  status: string; // 'Requested', 'Done', etc.
  main_editor_id: string | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  language: string | null;
  video_link: string | null;
  has_english_subtitle: boolean;
  has_indonesian_subtitle: boolean;
  revision_notes?: string | null;
  notes?: string | null;
  position: number;
  video_size_mb?: number | null;
}

export interface Assignment { // Project Assignments
  id: number;
  role: string;
  created_at: string;
  profiles: Profile;
  projects?: Project;
}
```

## 5. Core Functions (Server Actions)
All data mutations occur via Next.js Server Actions, ensuring security and avoiding client-side API building. Look in `actions.ts` files within the `src/app` directories. Notable functions include:

- **Project Management (`app/projects/[id]/actions.ts` & `app/projects/new/actions.ts`):** 
  - `createProject()`, `updateProjectDetails()`, `deleteProject()`, `toggleProjectStatus()`
- **Video Management (`app/projects/[id]/actions.ts`):** 
  - `addVideoToProject()`, `updateVideo()`, `deleteVideo()`, `moveVideo()` (handles position reordering), `updateVideoStatus()`
- **Team Assignments (`app/projects/[id]/actions.ts`):**
  - `assignTeamMember()`, `removeTeamMemberAssignment()`
  - Note: Using `assignTeamMember` with the 'Main Editor / Videographer' role optionally auto-syncs to the `videos.main_editor_id`.
- **Feedback Link Generation (`app/projects/[id]/actions.ts`):** 
  - `requestFeedback()` builds a readable slug for a specific project.
- **Admin/Master Data (`app/admin/actions.ts` and sub-directories):**
  - CRUD operations for terms, faculties, prodi, and lecturers (`addFaculty()`, `addLecturer()`, `deleteTerm()`, etc.)
  - User Approval logic (`approveUser()`, `rejectUser()`, `updateUserRole()`) in `app/admin/users/actions.ts`.

## 6. Data Flow & State Management
- **Server Components & SSR:** Data is fetched directly from Supabase within React Server Components to ensure fast, secure loads.
- **Server Actions:** All operations mentioned above trigger `revalidatePath('/path')` to refresh the UI dynamically without strict client-side state managers.
- **Authentication Strategy:** Validated server-side. Supabase session cookies dictate visibility of navigation and edit actions.

## 7. AI Contributor Guidelines
When modifying or extending this application:
1. **Prefer Server Actions:** Do not build traditional API routes unless creating webhooks.
2. **Strict Typing:** Ensure `src/lib/types.ts` is updated if the DB schema changes.
3. **Keep Components Clean:** Maintain the separation of UI primitives (`src/components/ui`) and feature components. Use `cn()` from `src/lib/utils.ts` for dynamic class names.
4. **Preserve Current Functionality:** This is a production-active app. Validate existing SQL queries and UI before modifying or deleting.

## 8. Analytics Attribution Rules

These rules govern how work is credited in the analytics page and must be preserved:

- **How `videos.main_editor_id` gets populated (the seed-and-override rule).** The team's rule: whoever *edited the video* gets the credit. So the project's Main Editor is seeded onto every video as the default, and a per-video change overrides it when someone else did that particular video. All three moments where a video or an editor appears must seed the column, or the work is credited to nobody:
  1. **Project created** — `createProject()` (`projects/new/actions.ts`) stamps the form's Main Editor onto every video it inserts. It must *not* write `project_assignments` and leave the videos null; that bug credited 31 videos to nobody until July 2026.
  2. **Video added mid-project** — `addVideoToProject()` looks up the project's Main Editor and stamps it. Ordered by `created_at, id` so the choice is deterministic when a project has several Main Editor assignments (three do).
  3. **Main Editor assigned later** — `assignTeamMember()` back-fills `WHERE main_editor_id IS NULL`. It deliberately never overwrites a non-null value, because an existing value is someone's override.

  Repair script for rows predating this: `db_backfill_main_editor.sql`.

  Every case, and what happens:

  | Scenario | Outcome |
  |---|---|
  | Main editor assigned at project creation | All videos seeded with them |
  | Video added later | Seeded with the project's main editor (earliest assignment if several) |
  | No main editor at first, assigned later | All videos are still null, so **all** get seeded — correct |
  | Some videos have their own editor, then a main editor is assigned | Only the null ones are seeded. Overrides survive — **it does not overwrite everything** |
  | Main editor replaced (hand-over) | Nothing is null any more, so the newcomer would be credited with **nothing**. Requires the explicit *reassign all* opt-in |
  | Main editor removed | Videos stay credited to them — they may have done the work |
  | Two co-main-editors | The first fills every null; the second gets nothing until videos are split per video |
  | Per-video editor changed | That video alone moves; the project assignment is untouched |
  | Any non-editor role assigned or removed | No effect on credit |

  **Every one of these that moves credit is confirmed in the UI** — never silently. `AssignedTeam` blocks the submit and states the exact counts (how many are seeded, how many are left alone and to whom); `VideoEditForm` names both people before saving a per-video change. The hand-over case is an opt-in checkbox marked as irreversible, because it rewrites credit for work someone may already have done.

  > ⚠️ Deliberate asymmetry: seeding never overwrites a non-null value. An existing value is somebody's override, and silently clobbering it would break the team's rule that credit follows whoever edited the video.

- **Editor attribution is per-video only.** The analytics reads `videos.main_editor_id` as the single source of truth for who edited each video. It does **not** use the `project_assignments` table to attribute editing minutes — the project assignment only determines the default editor when a video is first created. If a per-video override is set, only that person gets credit.
- **`teamVideos` filter:** Videos included in the Team Performance tab are those where `main_editor_id IS NOT NULL`. A role-based filter (DCS only) was intentionally removed because editors can have any system role (including Admin).
- **Sound engineers are tracked separately** from editors. Since sound engineers don't have per-video assignments, their contributions are derived from `project_assignments` (role = `'Sound Engineer'`) and credited for all completed videos in their assigned project. They appear in their own table, never in the Editor Workload chart.
- **Revision stats** come from the `video_feedback_log` table, scoped to the video IDs returned by the main query (so all active filters apply). `totalRevisionRequests` = total log entries; `videosWithRevision` = distinct video IDs in those logs.
- **Videos In Review** (`status = 'Review'`, excluding Pending/Cancelled projects) is a Key Metrics card representing the per-video review pipeline — videos sent to a lecturer for individual review before the project is fully complete.
- **On-Time Video Delivery** (Team Performance tab) is **per-video**, credited via `videos.main_editor_id` like all other editor attribution. A video is on time if `videos.delivered_at` (first hand-off to the lecturer) is on or before `COALESCE(videos.due_date, projects.due_date)`. Videos with no `delivered_at` or no deadline are reported as *Not Tracked* and excluded from the rate — never assumed on time. See §11 for the full rationale.
- **Feedback form ratings** (category scores, satisfaction trend) are still project-level — the form is only submitted by the lecturer when the whole project is done. Do not confuse this with the per-video `video_feedback_log` revision entries.

## 9. Established Business Logic & UI Conventions
The following functional rules and styling standardizations have been strictly implemented and must be respected:

- **Completed Projects Definition:** A project is inherently considered "Completed" if its `status` is explicitly set to `'Done'`, OR if a `feedback_submission` record exists for it.
- **Active Video Workload:** Videos only contribute to a team member's active workload calculations (on the dash, analytics, or assignment UI) if the parent project is **NOT** `'Pending'` and **NOT** `'Cancelled'`, and the video itself is **NOT** `'Done'`.
- **Role Color Scheme:** UI elements categorizing users (like avatar thumbnails, assignment dropdowns, workload cards, and admin badges) adhere to a strict semantic color mapping:
  - **Digital Content Specialist**: Blue (`bg-blue-50`, `text-blue-900`)
  - **Instructional Designer**: Purple (`bg-purple-50`, `text-purple-900`)
  - **Admin**: Yellow (`bg-yellow-50`, `text-yellow-900`)
- **Lecturer Management Constraints:** Alphabetical sorting uses `.trim()` to prevent blank space sorting errors. Deleting a lecturer via the Admin panel actively checks for tied projects and strictly blocks the deletion if any exist, protecting referential integrity.

## 10. Supabase Client Usage Rules ⚠️

This is a **critical architectural rule**. There are two Supabase client helpers, and using the wrong one will silently break features.

| Helper | File | Key Used | Bypasses RLS? | When to Use |
|---|---|---|---|---|
| `createClient()` | `src/lib/supabase/server.ts` | `ANON_KEY` | ❌ No | Authenticated routes only (reads/writes where a logged-in session exists) |
| `createServiceClient()` | `src/lib/supabase/service.ts` | `SERVICE_ROLE_KEY` | ✅ Yes | Public/unauthenticated routes that must write to the DB |

### The Public Feedback Form Pattern

The lecturer feedback form at `/feedback/[slug]` is **intentionally unauthenticated** — lecturers receive a unique link and fill it out without logging in. All Server Actions inside `src/app/feedback/[slug]/actions.ts` (`submitFeedback`, `externalApproveVideo`, `externalRequestRevision`) **must use `createServiceClient()`**.

**Why it broke:** In April 2026, a security audit tightened Supabase RLS policies across all tables. Before that, `feedback_submission` had permissive RLS that allowed anonymous writes. After the audit, the anon-key client (no session = anonymous user) was blocked by RLS, causing: `"Database Error: Could not submit feedback."`.

**The fix:** Use `createServiceClient()` in feedback actions. The `submission_uuid` in every query still scopes all operations to the correct row, so this is secure — the service key just lets the server-side action write past RLS.

> ⚠️ **Never expose `createServiceClient()` to browser-side code or API routes accessible without authentication.** It must only appear in `'use server'` files.

## 11. Date Columns: What Actually Exists ⚠️

Verified against the live database in July 2026. Getting this wrong produces silently misleading analytics rather than an error, because Postgres `select *` simply omits columns that don't exist and TypeScript happily types them as `undefined`.

**Columns that do NOT exist — never reference them:**

- `videos.updated_at` — **does not exist.** Selecting it explicitly returns Postgres error `42703`.
- `projects.updated_at` — **does not exist.**

**Columns that exist but are always NULL:**

- `projects.approval_date` — exists in the schema, but no code path ever writes it and 100% of rows are NULL. Do not build on it without first adding the write.

**Lecturer-side timestamps — useful, but NOT delivery dates:**

| Source | Coverage | What it actually means |
|---|---|---|
| `feedback_submission.submitted_at` | ~15 of 16 completed projects | When the **lecturer** submitted the feedback form |
| `video_feedback_log.created_at` where `status_context = 'Approved'` | ~4 of 16 completed projects | When the **lecturer** approved an individual video |

Neither is when the team delivered. Measured against `due_date` the lag ranges from −2 to **+204 days**, and projects 51/58/59/60 all carry the identical submission date `2026-03-03` — a retroactive batch of form fills, not four simultaneous deliveries. Never use these as a proxy for punctuality; that produced a bogus 11% team on-time rate.

### The delivery-tracking model (added July 2026)

`db_schema_ontime_delivery.sql` adds what was missing. Run it in the Supabase SQL Editor if it hasn't been applied.

| Column / table | Purpose |
|---|---|
| `videos.due_date` (DATE, nullable) | Per-video deadline. **NULL means inherit `projects.due_date`.** Needed because deadlines vary within a project — some classes take weekly deliveries. |
| `videos.delivered_at` (TIMESTAMPTZ, nullable) | First hand-off to the lecturer. Set **once** and never overwritten, so a revision round doesn't reset punctuality. |
| `due_date_changes` | Every deadline renegotiation (project- and video-level), with old/new date and who changed it. |

**Why `delivered_at` is stamped by a DB trigger, not a Server Action.** Multiple code paths move a video into `Review`: `markVideoReadyForReview()`, the `updateVideo()` status dropdown, and the lecturer-facing actions. The previous attempt to record this in one action is why `video_feedback_log` holds exactly **1** `Ready for Review` row against 393 videos — the team followed the workflow, but the common path (the edit form) logged nothing. The trigger `trg_stamp_video_delivered_at` covers every path, including ones added later. **Do not move this logic into application code.**

**Agreed measurement policy** (decided with the team, July 2026):

- **Delivery = first hand-off to the lecturer** (`status` → `Review`), because everything after that is lecturer response time the team can't control. Revisions after hand-off are a *quality* signal and belong to the revision stats, not punctuality.
- **Deadline = the latest agreed date**, so lecturer-requested reschedules are not counted as team lateness. The reschedules stay visible as a separate "deadline changes" count from `due_date_changes`.
- **No backfill.** Delivery dates for past work were never recorded and are not reconstructable. Historical rows stay NULL and surface as *Not Tracked*. The analytics card renders an explicit "tracking has just started" empty state rather than a table of zeroes.

### Two analytics bugs fixed in July 2026 — reported numbers changed

Both were consequences of the missing `updated_at`. **Any report produced before July 2026 carries the old, wrong figures.**

1. **Productivity Trend chart.** Read `v.updated_at || v.projects?.created_at`; since `updated_at` doesn't exist it *always* fell back, so "Videos Completed per Week" was silently bucketed by when projects were **requested**. Now buckets by the video's latest `Approved` entry in `video_feedback_log` — the only real per-video completion timestamp available. Videos with no approval record are **excluded**, not dated by proxy, and the excluded count is shown in the card subtitle. Effect: 262 videos plotted by request date → 61 plotted by real approval date, 201 excluded (approval logging only began January 2026).
2. **Revision stats.** Counted **every** `video_feedback_log` row as a revision request, including the 61 `Approved` and 1 `Ready for Review` entries. Now filters to `status_context = 'Revision Requested'`. Effect: revision rounds 76 → 14, videos needing rework 63 → 9, first-pass approval rate **76% → 97%**.

When adding a new `status_context` value, check both of these call sites — neither should treat an unrecognised context as a revision.

*(A duplicate section describing these two bugs as still-open was removed in July 2026 — both are fixed above.)*

## 12. The analytics chart system

The analytics page is one visual system, not a pile of independently styled charts. Two shared modules hold it together — **use them instead of hard-coding hex or rebuilding a card frame**:

| File | Provides |
|---|---|
| `src/app/analytics/chart-theme.ts` | `SERIES` (categorical slots), `BLUE_RAMP` (ordinal/sequential), `STATUS`, `INK`, `AXIS`, `TOOLTIP_STYLE`, `PIPELINE_STAGES`, and the number/duration formatters |
| `src/app/analytics/ui.tsx` | `ChartCard`, `StatTile`, `SectionHeading`, `Legend`, `Sparkline`, `ShareBar`, `EmptyState` |

Rules that were deliberate, not stylistic preference:

- **`SERIES` is assigned in fixed slot order and never cycled.** The order was validated for colour-vision-deficiency separation against a white surface (worst adjacent pair ΔE 9.1; normal-vision floor 19.6). Re-ordering or inserting a hue invalidates that — re-validate if you change it. Slots 3–5 fall below 3:1 contrast on white, so any chart using them must also carry visible value labels or a table.
- **`BLUE_RAMP` means magnitude or workflow position, never identity.** The pipeline card shades light → dark by stage order; those stages are not interchangeable series.
- **`STATUS` colours are reserved for state** (good/warning/serious/critical) and always ship beside a written label — never colour alone.
- **No dual-axis charts.** Two measures of different scale get two charts.
- **Empty states are written, not plotted.** A card with no data renders `EmptyState` explaining why, never a chart of zeroes — the on-time table is the canonical example (see §11's no-backfill policy).

### Derived metrics added July 2026 — what they actually measure

- **Median cycle time** (`Delivery & Flow` tiles): `videos.created_at` → the video's latest `Approved` entry in `video_feedback_log`, in calendar days. Median, not mean, because a few very old rows would otherwise drag the average somewhere no real video has been. Videos missing either endpoint are excluded and the sample size is printed on the tile. Note the start point is *when the video was logged in the tracker*, which is not necessarily when work began.
- **Production pipeline**: videos grouped by `status` in `PIPELINE_STAGES` order. Videos in Pending/Cancelled projects are counted separately as "parked" — folding them into `Requested` would overstate the queue. Unrecognised statuses are appended rather than dropped, so a new enum value can never vanish silently.
- **Deadline risk**: unfinished, non-parked videos bucketed by `differenceInCalendarDays(deadline, today)` where deadline is `videos.due_date ?? projects.due_date` — the **same rule the on-time table uses**, so the two cards can never disagree. This is a *snapshot of remaining risk* and is unrelated to `delivered_at`; it works on historical rows where punctuality does not.
- **Busiest editor's share**: the top editor's finished runtime as a percentage of the team's. High is a delivery risk (schedule depends on one person), not a compliment.

## 13. Academic years and term scoping (added July 2026)

`db_schema_academic_years.sql` adds a year layer above terms. Run it in the Supabase SQL
Editor if it hasn't been applied; it is idempotent.

| Column / table | Purpose |
|---|---|
| `academic_years` | `name` ('2025/2026'), `code` ('125' — the term-name prefix it owns), `is_active` |
| `terms.academic_year_id` | Which year a term belongs to |
| Partial unique index `academic_years_one_active` | Enforces **at most one active year** in the database, not in application code |

### What a term actually means ⚠️

**`projects.term_id` is the term the COURSE is for — not when the work happens.** Getting
this backwards is the single most expensive mistake available here, and it was made once
already. The two come apart in *both* directions, and the live data shows both:

- A 1251 course still in production a year later (`Basic Adolescence Health`, 46 videos, due 2026-12-30).
- A 1261 course recorded during the 25-26 year (`Pengantar Hukum Indonesia`, entered 2026-04-08).

The first version of this feature scoped live work to *the active year plus backwards
carry-over only*. That silently hid three live 1261 projects — 45 videos in flight —
because their term had not started yet. **Never gate live work by year.**

Note also that `projects.created_at` is **data-entry time, not request time**: most rows
were entered in a bulk backfill during Jan–Feb 2026, including 1251 projects whose due
dates are in August 2025. Do not read it as a commitment date.

### The scoping rule

| Work | Rule | Why |
|---|---|---|
| **Live** (not completed, not Pending/Cancelled) | **Always in scope**, whatever term it is for | Work in flight is work in flight; hiding it sends people more |
| **Completed / parked** | Scoped to the active year | That is a reporting question, and the term is what a report is about |

Out-of-year live work is **labelled, never hidden** — `yearRelation()` in
`src/lib/academic-year.ts` returns `behind` (its term has passed) or `ahead` (its term has
not started), rendered by `OutOfYearPill`. The asymmetry is deliberate: `behind` is amber
because something is slipping; `ahead` is grey because recording early is good practice and
colouring it would train people to ignore the colour.

Only `behind` gets its own dashboard tile. `ahead` sits inside Ongoing — it is ordinary
production, just early.

### Per-page differences (intentional)

- **Dashboard and workload** are operational: every live project, whatever its term.
- **Analytics** is strict — a year means exactly its terms, because a report describes a
  cohort. The two pages can therefore report different live counts for the same year. Both
  state their scope in words.

Analytics implements the year as a **shortcut that selects its terms** rather than a second
scoping mechanism: the term dropdown nests terms under year headings, and a heading toggles
its group. One consequence to preserve: a **missing** `terms` param means "not chosen yet →
active year", while a **present-but-empty** one means "cleared → all years". `buildParams`
therefore always writes `terms`, empty included; without that, changing an unrelated filter
would silently snap the scope back to the active year.

### Switching the active year

`setActiveAcademicYear()` is two writes — stand the incumbent down, then promote the
successor — because the partial unique index permits only one `true`. If the second write
fails, **no** year is active, which degrades to unscoped all-time figures and says so. That
is the right way round: two active years has no defined meaning. Admin-only, and the
consequences are spelled out in a confirmation modal rather than left as page furniture.

`getYearScope()` returns `NO_YEAR_SCOPE` if the tables are missing, so every consumer falls
back to its pre-feature all-time behaviour instead of throwing.

## 14. Where a sentence goes on a card (added July 2026)

`ChartCard` and `StatTile` each offer several slots for words. They are not
interchangeable, and mixing them is how the analytics cards ended up with two-sentence
descriptions that nobody read twice:

| Slot | Holds | Register |
|---|---|---|
| `title` | What the card is | Two or three words |
| `titleNote` (ⓘ) | How the figure is derived, what it excludes, what scope applies | One or two sentences, static |
| `description` | What the chart shows, so the reader can read it | One clause, no caveats |
| `footnote` | What *this* data says — counts, averages, exclusions | Dynamic, changes with the filters |
| `hint` (StatTile) | Caption under the figures | Five words or fewer |
| `note` (StatTile, ⓘ) | Same job as `titleNote` | One or two sentences |

The test for `titleNote` versus `description`: a description **introduces** the card, a
note **qualifies** it. "Unfinished videos by how close their deadline is" introduces;
"the deadline is the video's own due date where one is set, otherwise the project's"
qualifies. The second is true forever, needs saying once, and costs a line of the card
every day it stays visible.

Both ⓘ slots render `InfoNote` from `src/components/insight/primitives.tsx` — a native
`title` attribute, so it works in server components with no JavaScript, and carries
`tabIndex`/`aria-label` so it is reachable without a mouse. Do not hand-roll another one;
there were three copies before it was extracted.

**Deleting a caveat is not the alternative to hiding it.** These sentences exist because
figures here genuinely do not reconcile at a glance — "videos delivered" counts videos
inside projects that are still running, sound-engineer minutes overlap the editor
scorecard rather than adding to it. Someone will eventually try to make two numbers agree;
the ⓘ is what stops them concluding the app is wrong.

## 15. Glossary — one word per concept (added July 2026)

Before this was fixed there were **ten** phrases in the UI for "a video that isn't
finished": in flight, in the pipeline, outstanding, unfinished, still to deliver, videos
to deliver, videos in production, not yet marked Done, and an `Active` column head. Use
the left column; the right column is what it replaced.

| Concept | Say | Not |
|---|---|---|
| Video not yet finished | **in production** | in flight, in the pipeline, outstanding, unfinished, still to deliver, Active |
| Video finished (`status = 'Done'`) | **completed** | delivered, finished, done, approved |
| First hand-off to the lecturer (`videos.delivered_at`) | **delivered** | hand-off, handed over, reached the lecturer |
| Video sitting with a lecturer (`status = 'Review'`) | **in review** | waiting on lecturer, with the lecturer |
| Project currently running | **ongoing** | live, active |
| Project Pending or Cancelled | **parked** | (spelled out each time) |

### ⚠️ "Delivered" and "completed" are different populations

This is the distinction the whole glossary exists to protect, and the dashboard got it
wrong: the Completed card said *"262 videos delivered"* while counting `status = 'Done'`.

- **Delivered** = the first hand-off, when status became `Review`. Stamped in
  `videos.delivered_at`. It is what on-time delivery measures (§11).
- **Completed** = the lecturer approved it, `status = 'Done'`.

A video is delivered *and then* sits in review, sometimes for weeks, before it is
completed — the 20 videos in review are delivered but not completed. Using one word for
both makes the on-time rate irreconcilable with the dashboard, and the two figures cannot
be compared by anyone who has not read the code.

**"Active" is retired as a UI word.** It was simultaneously a `projects.status` value, a
column head meaning videos in production, and a synonym for ongoing. It survives only in
code (`isActiveStatus`) and as the literal status value stored in the database.

---

## 16. Reports (`/reports`, added July 2026)

Two printed documents built from the same data, scoped by term. The browser's own print
dialog turns them into PDFs — no headless Chrome, which would need `@sparticuz/chromium`
on Vercel and would rasterise text that is worth keeping selectable.

### The modules

| File | Holds |
|---|---|
| `src/lib/reports/metrics.ts` | Every figure either report can state. The single implementation of §8/§9/§11 for reporting. `/analytics` was migrated onto it, so the two can no longer disagree. |
| `src/app/reports/parts.tsx` | The printed vocabulary: `Masthead`, `Figure`, `SectionRule`, `ProjectBars`, `FacultySplit`, `CoverageRow`, `Rating`. |
| `src/app/reports/MemberReport.tsx` | One person's sheet. |
| `src/app/reports/TeamReport.tsx` | Three sheets: delivery, people, quality. The default view. |

### Rules a change here must not break

1. **Never sum editing credit and project-role credit.** They describe the same videos
   from two angles (§8). The sound engineer alone is credited with more videos than the
   whole editing total, so any total that adds them is nonsense. Both reports keep them in
   separate sections and say so on the page.
2. **`Main Editor / Videographer` is not a project-role section.** It exists in
   `project_assignments` but only seeds the per-video default; the credit is per-video and
   already reported. Listing it double-counts.
3. **State the denominator.** A percentage on paper has no tooltip. "Share of team editing"
   names its population, its size, and what an even split would be.
4. **Never present an unrecorded field as a measured zero.** Subtitles are a tick box, so
   the report says "marked as having" and explains that an empty row cannot distinguish
   "not done" from "not recorded". `CoverageRow` takes `neutral` for rows where a low
   number is the correct state, such as videos with their own deadline.
5. **Lecturer ratings are a property of the project, never of a person.** The form is
   submitted once per project and scores the whole team.

### Print

`globals.css` carries the whole print contract. Three parts, all load-bearing:

- **Unwinding the app shell.** `layout.tsx` is `h-screen overflow-hidden` around an
  `overflow-y-auto` column. On paper that clips the document to one viewport and prints
  the scrollbar track. The `app-shell` / `app-scroll` hooks exist only so `@media print`
  can return them to block flow at natural height. Do not remove those class names.
- **Breaking.** `.report-page + .report-page` starts a new sheet. `.report-block` is
  anything that must not be split across a fold; `.report-row` is one row of a list that
  may otherwise span a fold; `.report-keep-with-next` glues a heading to its content.
- **Colour.** Backgrounds are stripped by default, so `print-color-adjust: exact` is
  forced. `StaleContent` also disables its blur under print, or a refetch in progress
  would be committed permanently to the PDF.

### Colour meanings on a printed sheet

`SERIES[0]` is *completed* and `SERIES[1]` is *in production* for the whole page, so
categorical colours (faculties) start at `SERIES[2]`. A faculty wearing blue would make
one legend contradict another three centimetres below it. `buildFacultyColours` assigns
one map per sheet, biggest first, never cycling the palette.
