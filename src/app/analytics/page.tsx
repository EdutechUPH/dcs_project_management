// src/app/analytics/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AnalyticsFilters from "./AnalyticsFilters";
import AnalyticsChart from "./AnalyticsChart";
import KeyMetrics from "./KeyMetrics";

export const revalidate = 0;

export default async function AnalyticsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined }}) {
  const supabase = createClient();

  const toArray = (value: string | string[] | undefined) => {
    if (!value) return null;
    return Array.isArray(value) ? value : value.split(',');
  }

  const from = searchParams.from as string || null;
  const to = searchParams.to as string || null;
  const groupBy = searchParams.groupBy as string || 'faculty';
  const facultyIds = toArray(searchParams.faculties);
  const prodiIds = toArray(searchParams.prodi);
  const lecturerIds = toArray(searchParams.lecturers);
  const termIds = toArray(searchParams.terms);
  const editorIds = toArray(searchParams.editors);

  // Create a single params object for our functions
  const rpcParams = {
    start_date: from,
    end_date: to,
    faculty_ids: facultyIds,
    prodi_ids: prodiIds,
    lecturer_ids: lecturerIds,
    term_ids: termIds,
    editor_ids: editorIds
  };

  // Fetch data for all reports in parallel
  const analyticsPromise = supabase.rpc('get_analytics_data', { ...rpcParams, group_by_key: groupBy });
  const keyMetricsPromise = supabase.rpc('get_key_metrics', rpcParams).single();

  const [
    { data: analyticsData, error: analyticsError },
    { data: keyMetricsData, error: keyMetricsError }
  ] = await Promise.all([analyticsPromise, keyMetricsPromise]);

  // Fetch data for the filter dropdowns
  const facultiesPromise = supabase.from('faculties').select('id, name');
  const prodiPromise = supabase.from('prodi').select('id, name');
  const lecturersPromise = supabase.from('lecturers').select('id, name');
  const termsPromise = supabase.from('terms').select('id, name');
  const editorsPromise = supabase.from('profiles').select('id, full_name');
  const [
    { data: faculties }, { data: prodi }, { data: lecturers }, { data: terms }, { data: editors }
  ] = await Promise.all([facultiesPromise, prodiPromise, lecturersPromise, termsPromise, editorsPromise]);

  const error = analyticsError || keyMetricsError;
  if (error) {
    console.error("Error fetching analytics data:", error);
    return <p>Error loading data. Please check the server console.</p>;
  }

  const mapToOptions = (items: any[], labelKey = 'name') => {
    return items?.map(item => ({ value: item.id.toString(), label: item[labelKey] })) || [];
  }

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
        editors={mapToOptions(editors, 'full_name')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AnalyticsChart data={analyticsData || []} title="Active Videos" dataKey="active_count" fillColor="#3b82f6" />
        <AnalyticsChart data={analyticsData || []} title="Completed Videos" dataKey="completed_count" fillColor="#10b981" />
      </div>
    </div>
  );
}