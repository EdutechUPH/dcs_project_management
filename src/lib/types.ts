// src/lib/types.ts

// Define the shape of a single Profile
export type Profile = {
  id: string;
  full_name: string;
  role: 'Admin' | 'Instructional Designer' | 'Digital Content Specialist';
  email?: string; // Optional email
};

// Define the shape of a single Video
export type Video = {
  id: number;
  created_at: string;
  project_id: number;
  title: string;
  status: string;
  main_editor_id: string | null;
  // ... add all other video fields here as needed
  duration_minutes: number | null;
  duration_seconds: number | null;
  language: string | null;
  video_link: string | null;
  has_english_subtitle: boolean;
  has_indonesian_subtitle: boolean;
  profiles: Profile | null; // A video can have one main editor
};

// Define the shape of a single Project Assignment
export type Assignment = {
  id: number;
  role: string;
  profiles: Profile;
};

// Define the shape of a single Project
export type Project = {
  id: number;
  course_name: string;
  due_date: string;
  lecturers: { name: string } | null;
  prodi: { name: string } | null;
  videos: Video[];
  project_assignments: Assignment[];
  feedback_submission: { submitted_at: string | null } | null;
};