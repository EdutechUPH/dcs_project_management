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
}


// --- Component & Page Specific Types ---

export interface AnalyticsData {
  category: string;
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
}