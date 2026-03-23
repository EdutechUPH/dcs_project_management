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
- **`/analytics`:** Provides charts and key metrics data (e.g., total videos completed, average satisfaction score).
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
- **`project_status`** *(Used for Videos)*: Requested, Scheduled for Taping, Audio Editing, Video Editing, Review, Done
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
