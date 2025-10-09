// src/app/analytics/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AnalyticsFilters from "./AnalyticsFilters";
import AnalyticsChart from "./AnalyticsChart";
import KeyMetrics from "./KeyMetrics";
import { type AnalyticsData, type KeyMetricsData } from "@/lib/types";

// Minimal shapes used by this page (avoid `any`)
type Named = { id: number | string; name: string };
type ProfileNamed = { id: string; full_name: string | null };

type ProjectJoin = {
  created_at?: string | null;
  faculty_id?: string | null;
  prodi_id?: string | null;
  lecturer_id?: string | null;
  term_id?: string | null;
  faculties?: Named | null;
  prodi?: Named | null;
  lecturers?: Named | null;
  terms?: Named | null;
};

type VideoRow = {
  status: string;
  duration_minutes?: number | null;
  duration_seconds?: number | null;
  main_editor_id?: string | null;
  projects?: ProjectJoin | null;
  profiles?: ProfileNamed | null; // main editor profile
};

// Local, minimal type for mapping dropdown items
type Mappable = {
  id: number | string;
  name?: string;
  full_name?: string;
};

export const revalidate = 0;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const toArray = (value: string | string[] | undefined): string[] | null => {
    if (!value) return null;
    return Array.isArray(value) ? value : value.split(",");
  };

  // --- Read all filters from the URL ---
  const from = (searchParams.from as string) || null;
  const to = (searchParams.to as string) || null;
  const groupBy = (searchParams.groupBy as string) || "faculty";
  const facultyIds = toArray(searchParams.faculties);
  const prodiIds = toArray(searchParams.prodi);
  const lecturerIds = toArray(searchParams.lecturers);
  const termIds = toArray(searchParams.terms);
  const editorIds = toArray(searchParams.editors);

  // --- Query videos + related project/editor info ---
  // Use !inner so filtering on `projects.*` works as intended.
  let query = supabase
    .from("videos")
    .select(
      `
      *,
      projects!inner (
        *,
        faculties ( id, name ),
        prodi ( id, name ),
        lecturers ( id, name ),
        terms ( id, name )
      ),
      profiles ( id, full_name )
    `
    );

  // Apply filters directly to the query
  if (from) query = query.gte("projects.created_at", from);
  if (to) query = query.lte("projects.created_at", to);
  if (facultyIds) query = query.in("projects.faculty_id", facultyIds);
  if (prodiIds) query = query.in("projects.prodi_id", prodiIds);
  if (lecturerIds) query = query.in("projects.lecturer_id", lecturerIds);
  if (termIds) query = query.in("projects.term_id", termIds);
  if (editorIds) query = query.in("main_editor_id", editorIds);

  const queryRes = await query;

  if (queryRes.error) {
    console.error("Error fetching analytics data:", queryRes.error);
    return <p>Error loading data. Please check the server console.</p>;
  }

  // Cast to the narrow shape we use in this page
  const videos: VideoRow[] = (queryRes.data ?? []) as VideoRow[];

  // --- Key Metrics from filtered videos ---
  const completedVideos = videos.filter((v) => v.status === "Done");
  const totalMinutes = completedVideos.reduce(
    (acc, v) => acc + (v.duration_minutes ?? 0),
    0
  );
  const totalSeconds = completedVideos.reduce(
    (acc, v) => acc + (v.duration_seconds ?? 0),
    0
  );
  const keyMetricsData: KeyMetricsData = {
    total_videos_completed: completedVideos.length,
    total_duration_minutes: totalMinutes + Math.floor(totalSeconds / 60),
    total_duration_seconds: totalSeconds % 60,
  };

  // --- Aggregate data for charts ---
  const getCategory = (video: VideoRow): string => {
    switch (groupBy) {
      case "faculty":
        return video.projects?.faculties?.name ?? "N/A";
      case "prodi":
        return video.projects?.prodi?.name ?? "N/A";
      case "lecturer":
        return video.projects?.lecturers?.name ?? "N/A";
      case "term":
        return video.projects?.terms?.name ?? "N/A";
      case "editor":
        return video.profiles?.full_name ?? "Unassigned";
      default:
        return "Overall";
    }
  };

  const aggregatedData = videos.reduce<Record<string, AnalyticsData>>((acc, video) => {
    const category = getCategory(video);
    if (!acc[category]) {
      acc[category] = { category, active_count: 0, completed_count: 0 };
    }
    if (video.status === "Done") {
      acc[category].completed_count += 1;
    } else {
      acc[category].active_count += 1;
    }
    return acc;
  }, {});

  const analyticsData = Object.values(aggregatedData);

  // --- Fetch data for filter dropdowns ---
  const facultiesPromise = supabase.from("faculties").select("id, name");
  const prodiPromise = supabase.from("prodi").select("id, name");
  const lecturersPromise = supabase.from("lecturers").select("id, name");
  const termsPromise = supabase.from("terms").select("id, name");
  const editorsPromise = supabase.from("profiles").select("id, full_name");

  const [
    { data: faculties },
    { data: prodi },
    { data: lecturers },
    { data: terms },
    { data: editors },
  ] = await Promise.all([
    facultiesPromise,
    prodiPromise,
    lecturersPromise,
    termsPromise,
    editorsPromise,
  ]);

  const mapToOptions = (items: Mappable[] | null | undefined) =>
    (items ?? []).map((item) => ({
      value: item.id.toString(),
      label: item.full_name || item.name || "",
    }));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Link href="/" className="text-sm text-gray-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <KeyMetrics data={keyMetricsData} />

      <AnalyticsFilters
        faculties={mapToOptions(faculties)}
        prodi={mapToOptions(prodi)}
        lecturers={mapToOptions(lecturers)}
        terms={mapToOptions(terms)}
        editors={mapToOptions(editors)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AnalyticsChart
          data={analyticsData}
          title="Active Videos"
          dataKey="active_count"
          fillColor="#3b82f6"
        />
        <AnalyticsChart
          data={analyticsData}
          title="Completed Videos"
          dataKey="completed_count"
          fillColor="#10b981"
        />
      </div>
    </div>
  );
}
