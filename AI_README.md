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
- **`/analytics`:** Provides charts and key metrics across three tabs:
  - **Overview & Trends:** Key metrics (videos completed, duration, satisfaction, videos in review), weekly completion trend, active/completed counts by grouping.
  - **Team Performance:** Editor workload distribution chart (minutes by project type, horizontal stacked bars), Editor Leaderboard, Sound Engineer Contributions table.
  - **Feedback Insights:** Revision stats (total revision rounds, first-pass approval rate from `video_feedback_log`), category scores, satisfaction trend.
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

### Two known consequences elsewhere in analytics

1. **Productivity Trend chart** (`analytics/page.tsx`) reads `v.updated_at || v.projects?.created_at`. Since `updated_at` does not exist, it *always* falls back to the project's request date — so "Videos Completed per Week" is really bucketed by when projects were requested, not completed.
2. **Revision stats** count **every** `video_feedback_log` row as a revision request, including the 61 `Approved` and 1 `Ready for Review` entries. `totalRevisionRequests` and the derived rate are therefore inflated; only `status_context = 'Revision Requested'` (14 rows) represents an actual revision.

