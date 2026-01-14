// src/app/analytics/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AnalyticsFilters from "./AnalyticsFilters";
import AnalyticsChart from "./AnalyticsChart";
import StackedWorkloadChart from "./StackedWorkloadChart";
import KeyMetrics from "./KeyMetrics";
import VideoCompletionTrend from "./VideoCompletionTrend";
import EditorLeaderboard from "./EditorLeaderboard";
import FeedbackCategoryChart from "./FeedbackCategoryChart";
import SatisfactionTrend from "./SatisfactionTrend";
import TeamFilters from "./TeamFilters";
import { type AnalyticsData, type KeyMetricsData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfWeek } from 'date-fns';

// Minimal shapes used by this page
type Named = { id: number | string; name: string; short_name?: string | null };
type ProfileNamed = { id: string; full_name: string | null; role?: string | null };

type FeedbackSub = {
  rating_final_product?: number | null;
  rating_pre_production?: number | null;
  rating_communication?: number | null;
  rating_quality?: number | null;
  rating_timeliness?: number | null;
  created_at?: string | null;
};

type ProjectJoin = {
  id: number;
  created_at?: string | null;
  updated_at?: string | null;
  faculty_id?: string | null;
  prodi_id?: string | null;
  lecturer_id?: string | null;
  term_id?: string | null;
  project_type?: string | null;
  faculties?: Named | null;
  prodi?: Named | null;
  lecturers?: Named | null;
  terms?: Named | null;
  feedback_submission?: FeedbackSub | null;
  project_assignments?: { profile_id: string; role: string }[];
};

type VideoRow = {
  status: string;
  duration_minutes?: number | null;
  duration_seconds?: number | null;
  main_editor_id?: string | null;
  updated_at?: string | null;
  projects?: ProjectJoin | null;
  profiles?: ProfileNamed | null;
};

type Mappable = {
  id: number | string;
  name?: string;
  full_name?: string;
};

export const revalidate = 0;

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const toArray = (value: string | string[] | undefined): string[] | null => {
    if (!value) return null;
    return Array.isArray(value) ? value : value.split(",");
  };

  // --- Filters ---
  const from = (searchParams.from as string) || null;
  const to = (searchParams.to as string) || null;
  const groupBy = (searchParams.groupBy as string) || "faculty";
  const facultyIds = toArray(searchParams.faculties);
  const prodiIds = toArray(searchParams.prodi);
  const lecturerIds = toArray(searchParams.lecturers);
  const termIds = toArray(searchParams.terms);
  const editorIds = toArray(searchParams.editors);
  const mainEditorOnly = searchParams.mainEditorOnly !== 'false'; // Default to true

  // --- Main Query ---
  let query = supabase
    .from("videos")
    .select(
      `
      *,
      projects!inner (
        *,
        faculties ( id, name, short_name ),
        prodi ( id, name ),
        lecturers ( id, name ),
        terms ( id, name ),
        feedback_submission ( 
            rating_final_product,
            rating_pre_production,
            rating_communication,
            rating_quality,
            rating_timeliness,
            rating_timeliness,
            created_at
        ),
        project_assignments ( profile_id, role )
      ),
      profiles ( id, full_name, role )
    `
    );

  if (from) query = query.gte("projects.created_at", from);
  if (to) query = query.lte("projects.created_at", to);
  if (facultyIds) query = query.in("projects.faculty_id", facultyIds);
  if (prodiIds) query = query.in("projects.prodi_id", prodiIds);
  if (lecturerIds) query = query.in("projects.lecturer_id", lecturerIds);
  if (termIds) query = query.in("projects.term_id", termIds);
  if (editorIds) query = query.in("main_editor_id", editorIds);

  const queryRes = await query;
  if (queryRes.error) {
    console.error("Error fetching data:", queryRes.error);
    return <p>Error loading data.</p>;
  }

  let videos: VideoRow[] = (queryRes.data ?? []) as VideoRow[];

  // --- Team Tab Data (Scoped Filter) ---
  let teamVideos = videos;
  if (mainEditorOnly) {
    teamVideos = videos.filter(v => {
      // 1. Must be a DCS (System Role)
      const isDCS = v.profiles?.role === 'Digital Content Specialist';
      if (!isDCS) return false;

      // 2. Must be assigned as 'Main Editor / Videographer' on this specific project
      const userAssignment = v.projects?.project_assignments?.find(
        (a) => a.profile_id === v.main_editor_id
      );

      return userAssignment?.role === 'Main Editor / Videographer';
    });
  }

  const completedVideos = videos.filter((v) => v.status === "Done");

  // --- Key Metrics ---
  const completedProductionVideos = completedVideos.filter(v => v.projects?.project_type !== 'Translation');
  const totalMinutes = completedProductionVideos.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0);
  const totalSeconds = completedProductionVideos.reduce((acc, v) => acc + (v.duration_seconds ?? 0), 0);

  const uniqueProjectsWithFeedback = new Map();
  completedVideos.forEach(v => {
    const rating = v.projects?.feedback_submission?.rating_final_product;
    if (v.projects?.id && rating) {
      uniqueProjectsWithFeedback.set(v.projects.id, rating);
    }
  });

  const totalScore = Array.from(uniqueProjectsWithFeedback.values()).reduce((sum: number, score: any) => sum + (Number(score) || 0), 0);
  const avgScore = uniqueProjectsWithFeedback.size > 0 ? totalScore / uniqueProjectsWithFeedback.size : null;

  const keyMetricsData: KeyMetricsData = {
    total_videos_completed: completedProductionVideos.length,
    total_duration_minutes: totalMinutes + Math.floor(totalSeconds / 60),
    total_duration_seconds: totalSeconds % 60,
    avg_satisfaction_score: avgScore,
  };

  // --- Weekly Trend Data for Overview ---
  const trendMap: Record<string, { date: string; count: number; sortKey: number }> = {};

  completedVideos.forEach(v => {
    const dateStr = v.updated_at || v.projects?.created_at;
    if (!dateStr) return;

    const date = parseISO(dateStr);
    // Get start of week (Sunday or Monday depending on locale, default Sunday)
    const weekStart = startOfWeek(date);
    const weekLabel = format(weekStart, 'd MMM'); // e.g., "1 Jan", "8 Jan"
    const sortKey = weekStart.getTime();

    if (!trendMap[weekLabel]) {
      trendMap[weekLabel] = { date: weekLabel, count: 0, sortKey };
    }
    trendMap[weekLabel].count += 1;
  });

  const trendData = Object.values(trendMap).sort((a, b) => a.sortKey - b.sortKey);

  // --- Editor Leaderboard Data ---
  const leaderboardMap: Record<string, { editorId: string; editorName: string; completedVideos: number; activeVideos: number; minutesProduced: number }> = {};

  teamVideos.forEach(v => {
    const editorId = v.main_editor_id ?? "unassigned";
    const editorName = v.profiles?.full_name ?? "Unassigned";

    if (editorId === "unassigned") return;

    if (!leaderboardMap[editorId]) {
      leaderboardMap[editorId] = { editorId, editorName, completedVideos: 0, activeVideos: 0, minutesProduced: 0 };
    }

    if (v.status === 'Done') {
      leaderboardMap[editorId].completedVideos += 1;
      if (v.projects?.project_type !== 'Translation') {
        const minutes = (v.duration_minutes || 0) + (v.duration_seconds || 0) / 60;
        leaderboardMap[editorId].minutesProduced += minutes;
      }
    } else {
      leaderboardMap[editorId].activeVideos += 1;
    }
  });
  const leaderboardData = Object.values(leaderboardMap);

  // --- Feedback Analysis Data ---
  let satisfactionTrendMap: Record<string, { date: string; sum: number; count: number; sortKey: number }> = {};
  let categoryScores = {
    pre: { sum: 0, count: 0, label: "Pre-Production" },
    comm: { sum: 0, count: 0, label: "Communication" },
    qual: { sum: 0, count: 0, label: "Quality" },
    time: { sum: 0, count: 0, label: "Timeliness" },
    final: { sum: 0, count: 0, label: "Final Product" }
  };

  // Iterate over UNIQUE projects for feedback stats so we don't count same feedback multiple times per video
  // We need to map by Project ID first
  const projectFeedbacks = new Map<number, FeedbackSub>();

  videos.forEach(v => {
    if (v.projects?.id && v.projects.feedback_submission) {
      projectFeedbacks.set(v.projects.id, v.projects.feedback_submission);
    }
  });

  projectFeedbacks.forEach(fb => {
    // 1. Avg Scores
    if (fb.rating_pre_production) { categoryScores.pre.sum += fb.rating_pre_production; categoryScores.pre.count++; }
    if (fb.rating_communication) { categoryScores.comm.sum += fb.rating_communication; categoryScores.comm.count++; }
    if (fb.rating_quality) { categoryScores.qual.sum += fb.rating_quality; categoryScores.qual.count++; }
    if (fb.rating_timeliness) { categoryScores.time.sum += fb.rating_timeliness; categoryScores.time.count++; }
    if (fb.rating_final_product) { categoryScores.final.sum += fb.rating_final_product; categoryScores.final.count++; }

    // 2. Trend (also weekly for consistency?)
    if (fb.created_at && fb.rating_final_product) {
      const date = parseISO(fb.created_at);
      const weekStart = startOfWeek(date);
      const weekLabel = format(weekStart, 'd MMM');
      const sortKey = weekStart.getTime();

      if (!satisfactionTrendMap[weekLabel]) {
        satisfactionTrendMap[weekLabel] = { date: weekLabel, sum: 0, count: 0, sortKey };
      }
      satisfactionTrendMap[weekLabel].sum += fb.rating_final_product;
      satisfactionTrendMap[weekLabel].count += 1;
    }
  });

  const feedbackCategoryData = [
    { category: 'Pre-Prod', fullLabel: "Pre-Production", score: categoryScores.pre.count ? categoryScores.pre.sum / categoryScores.pre.count : 0 },
    { category: 'Comm', fullLabel: "Communication", score: categoryScores.comm.count ? categoryScores.comm.sum / categoryScores.comm.count : 0 },
    { category: 'Quality', fullLabel: "Quality", score: categoryScores.qual.count ? categoryScores.qual.sum / categoryScores.qual.count : 0 },
    { category: 'Timeline', fullLabel: "Timeliness", score: categoryScores.time.count ? categoryScores.time.sum / categoryScores.time.count : 0 },
    { category: 'Final', fullLabel: "Final Product", score: categoryScores.final.count ? categoryScores.final.sum / categoryScores.final.count : 0 },
  ];

  const satisfactionTrendData = Object.values(satisfactionTrendMap)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(item => ({
      date: item.date,
      score: item.sum / item.count,
      sortKey: item.sortKey // passed for sorting if needed by chart, though mapped out usually
    }));

  // --- General Charts ---
  const getCategory = (video: VideoRow): { name: string; fullName: string } => {
    switch (groupBy) {
      case "faculty": return { name: video.projects?.faculties?.short_name || "N/A", fullName: video.projects?.faculties?.name || "N/A" };
      case "prodi": return { name: video.projects?.prodi?.name ?? "N/A", fullName: video.projects?.prodi?.name ?? "N/A" };
      case "lecturer": return { name: video.projects?.lecturers?.name ?? "N/A", fullName: video.projects?.lecturers?.name ?? "N/A" };
      case "term": return { name: video.projects?.terms?.name ?? "N/A", fullName: video.projects?.terms?.name ?? "N/A" };
      case "editor": return { name: video.profiles?.full_name ?? "Unassigned", fullName: video.profiles?.full_name ?? "Unassigned" };
      case "type": return { name: video.projects?.project_type ?? "Editing", fullName: video.projects?.project_type ?? "Editing" };
      default: return { name: "Overall", fullName: "Overall" };
    }
  };

  const aggregatedData = videos.reduce<Record<string, AnalyticsData & { full_category: string }>>((acc, video) => {
    const { name: category, fullName } = getCategory(video);
    if (groupBy === 'editor' && category === 'Unassigned') return acc;
    if (!acc[category]) acc[category] = { category, full_category: fullName, active_count: 0, completed_count: 0 };
    video.status === "Done" ? acc[category].completed_count++ : acc[category].active_count++;
    return acc;
  }, {});

  const analyticsData = Object.values(aggregatedData);

  // --- Workload Data ---
  const completedTeamVideos = teamVideos.filter(v => v.status === "Done");
  const workloadData = completedTeamVideos.reduce<Record<string, { name: string, [key: string]: number | string }>>((acc, video) => {
    const editorName = video.profiles?.full_name || "Unassigned";
    const type = video.projects?.project_type || "Editing";
    if (type === 'Translation') return acc;
    if (editorName === 'Unassigned') return acc;
    const minutes = (video.duration_minutes || 0) + (video.duration_seconds || 0) / 60;
    if (!acc[editorName]) acc[editorName] = { name: editorName };
    if (!acc[editorName][type]) acc[editorName][type] = 0;
    acc[editorName][type] = (acc[editorName][type] as number) + Math.round(minutes * 100) / 100;
    return acc;
  }, {});
  const stackedChartData = Object.values(workloadData);

  // --- Fetch Filter Options ---
  const [
    { data: faculties },
    { data: prodi },
    { data: lecturers },
    { data: terms },
    { data: editors },
  ] = await Promise.all([
    supabase.from("faculties").select("id, name, short_name"),
    supabase.from("prodi").select("id, name"),
    supabase.from("lecturers").select("id, name"),
    supabase.from("terms").select("id, name"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const mapToOptions = (items: Mappable[] | null | undefined) =>
    (items ?? []).map((item) => ({ value: item.id.toString(), label: item.full_name || item.name || "" }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">← Back to Projects</Link>
      </div>

      <AnalyticsFilters
        faculties={mapToOptions(faculties)}
        prodi={mapToOptions(prodi)}
        lecturers={mapToOptions(lecturers)}
        terms={mapToOptions(terms)}
        editors={mapToOptions(editors)}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100/80 p-1.5 rounded-xl">
          <TabsTrigger value="overview" className="text-sm md:text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all">Overview & Trends</TabsTrigger>
          <TabsTrigger value="team" className="text-sm md:text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all">Team Performance</TabsTrigger>
          <TabsTrigger value="feedback" className="text-sm md:text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all">Feedback Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <KeyMetrics data={keyMetricsData} />
          {trendData.length > 0 && <VideoCompletionTrend data={trendData} title="Productivity Trend (Videos Completed per Week)" />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart data={analyticsData} title={`Active Videos (by ${groupBy})`} dataKey="active_count" fillColor="#3b82f6" />
            <AnalyticsChart data={analyticsData} title={`Completed Videos (by ${groupBy})`} dataKey="completed_count" fillColor="#10b981" />
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamFilters />
          <div className="grid grid-cols-1 gap-6">
            <StackedWorkloadChart data={stackedChartData} title="Team Workload Distribution (Minutes Produced by Type)" />
            <EditorLeaderboard data={leaderboardData} />
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeedbackCategoryChart data={feedbackCategoryData} title="Average Score by Category" />
            {satisfactionTrendData.length > 0 ? (
              <SatisfactionTrend data={satisfactionTrendData} title="Satisfaction Trend (Weekly)" />
            ) : (
              <div className="p-12 border rounded-lg bg-gray-50 text-center text-gray-400 border-dashed justify-center flex items-center h-[400px]">
                Not enough feedback data for trend analysis
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
