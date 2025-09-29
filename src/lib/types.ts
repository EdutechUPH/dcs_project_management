// src/lib/types.ts

// Using interfaces for clearer type definitions
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
  profiles: Profile | null; // For the main editor
}

export interface Assignment {
  id: number;
  role: string;
  created_at: string;
  profiles: Profile;
  projects: Project; // A project can be nested inside an assignment
}

export interface FeedbackSubmission {
  submission_uuid: string;
  submitted_at: string | null;
}

export interface Project {
  id: number;
  course_name: string;
  due_date: string;
  lecturers: { name: string } | null;
  prodi: { name: string, faculties?: { name: string } | null } | null;
  terms: { name: string } | null;
  videos: Video[];
  project_assignments: Assignment[];
  feedback_submission: FeedbackSubmission | null;
}