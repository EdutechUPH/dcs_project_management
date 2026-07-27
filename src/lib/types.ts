// src/lib/types.ts

// --- Basic Reusable Types ---
export interface Option {
  id: number;
  name: string;
}

export interface ProdiOption extends Option {
  faculty_id: number;
}

export interface LecturerOption {
  id: number;
  name: string;
  email: string | null;
}

// --- Core Data Models ---
export interface Profile {
  id: string;
  full_name: string;
  role: 'Admin' | 'Instructional Designer' | 'Digital Content Specialist';
  email?: string;
  project_assignments?: Assignment[]; // 👈 add this line here
}

export interface Video {
  id: number;
  created_at: string;
  project_id: number;
  title: string;
  status: string;
  main_editor_id: string | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  language: string | null;
  video_link: string | null;
  has_english_subtitle: boolean;
  has_indonesian_subtitle: boolean;
  profiles: Profile | null;
  revision_notes?: string | null;
  notes?: string | null; // Internal notes
  position: number;
  video_size_mb?: number | null;
  /** Per-video deadline. NULL = inherit projects.due_date. See AI_README §11. */
  due_date?: string | null;
  /** First hand-off to the lecturer (status entered 'Review'). Stamped by DB trigger. */
  delivered_at?: string | null;
}

export interface Assignment {
  id: number;
  role: string;
  created_at: string;
  profiles: Profile;
  projects?: Project; // projects can sometimes be null in this context
}

export interface FeedbackSubmission {
  submission_uuid: string;
  submitted_at: string | null;
}

export interface Project {
  id: number;
  created_at: string; // Added requested date
  course_name: string;
  due_date: string;
  notes: string | null;
  term_id: number;
  faculty_id: number;
  prodi_id: number;
  lecturer_id: number;
  lecturers: { name: string } | null;
  prodi: { name: string, faculties?: { name: string } | null } | null;
  terms: { name: string } | null;
  videos: Video[];
  project_assignments: Assignment[];
  feedback_submission: FeedbackSubmission | null;
  status?: string;
  project_folder_url?: string | null;
  /**
   * Set when this project's term sits outside the active academic year — either behind
   * it (the term has passed) or ahead of it (the term has not started). Null or absent
   * for current-year work, so the pill marks the exception rather than every row.
   *
   * Attached by the page building the row rather than read from the database, because
   * "outside the active year" is only meaningful relative to whichever year is active.
   * It rides on the row because `columns` is a client-module reference passed from a
   * server component: the server cannot call a factory to close over the set, but it
   * can put plain data on each row.
   */
  outOfYearTerm?: { term: string; direction: 'behind' | 'ahead' } | null;
}


// --- Component & Page Specific Types ---

export interface AnalyticsData {
  category: string;
  full_category?: string;
  active_count: number;
  completed_count: number;
}

export interface FeedbackSummary {
  avg_pre_production: number | null;
  avg_communication: number | null;
  avg_quality: number | null;
  avg_timeliness: number | null;
  avg_final_product: number | null;
  avg_recommendation: number | null;
}

export interface WorkloadProfile extends Profile {
  ongoing_projects: {
    assignment_id: number;
    role: string;
    assigned_at: string;
    projects: Project;
  }[];
}

export interface Workload {
  member_name: string;
  active_videos: number;
}

// Add this to the bottom of src/lib/types.ts
export interface KeyMetricsData {
  total_videos_completed: number;
  total_duration_minutes: number;
  total_duration_seconds: number;
  avg_satisfaction_score: number | null;
  videos_in_review: number;
  /** Videos not yet Done in projects that are neither Pending nor Cancelled. */
  active_videos: number;
  /** Median days from a video being logged in the tracker to lecturer approval. */
  median_cycle_days: number | null;
  /** Videos the cycle-time median could be measured on. */
  cycle_sample: number;
  /** Share of completed videos approved without a revision round, 0–100. */
  first_pass_rate: number | null;
  /** Weekly completion counts, oldest → newest, for the sparkline. */
  completion_sparkline: number[];
}

// Add this to the bottom of src/lib/types.ts

export interface AnalyticsRpcParams {
  start_date: string | null;
  end_date: string | null;
  group_by_key: string;
  faculty_ids: string[] | null;
  prodi_ids: string[] | null;
  lecturer_ids: string[] | null;
  term_ids: string[] | null;
  editor_ids: string[] | null;
}

export interface VideoFeedbackLog {
  id: number;
  video_id: number;
  feedback_text: string;
  created_at: string;
  status_context: string | null;
}