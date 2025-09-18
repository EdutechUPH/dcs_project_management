// src/app/analytics/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server"; // Use the server helper
import WorkloadChart from "./WorkloadChart";
import FacultyOutputChart from "./FacultyOutputChart";

export const revalidate = 0;

export default async function AnalyticsPage() {
  const supabase = createClient(); // Create the client instance

  const workloadPromise = supabase.rpc('get_team_workload');
  const facultyOutputPromise = supabase.rpc('get_output_by_faculty');

  const [
    { data: workloadData, error: workloadError },
    { data: facultyOutputData, error: facultyOutputError }
  ] = await Promise.all([workloadPromise, facultyOutputPromise]);

  const error = workloadError || facultyOutputError;

  if (error) {
    console.error("Error fetching analytics data:", error);
    return <p>Error loading data. Please check the server console.</p>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Link href="/" className="text-sm text-gray-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkloadChart data={workloadData || []} />
        <FacultyOutputChart data={facultyOutputData || []} />
      </div>

    </div>
  );
}