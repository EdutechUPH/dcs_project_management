// src/app/analytics/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AnalyticsFilters from "./AnalyticsFilters";
import { FilterStatusProvider, StaleContent } from "./FilterStatus";
import PortfolioBreakdown from "./PortfolioBreakdown";
import PipelineFunnel, { type PipelineStage } from "./PipelineFunnel";
import DeadlineRisk, { type AtRiskProject, type RiskBucket } from "./DeadlineRisk";
import StackedWorkloadChart from "./StackedWorkloadChart";
import KeyMetrics from "./KeyMetrics";
import VideoCompletionTrend from "./VideoCompletionTrend";
import EditorLeaderboard from "./EditorLeaderboard";
import FeedbackCategoryChart from "./FeedbackCategoryChart";
import SatisfactionTrend from "./SatisfactionTrend";
import SoundEngineerTable from "./SoundEngineerTable";
import OnTimeDeliveryTable, { type OnTimeEntry } from "./OnTimeDeliveryTable";
import RevisionStats from "./RevisionStats";
import { SectionHeading, StatTile, EmptyState } from "./ui";
import { PIPELINE_STAGES, formatMinutes } from "./chart-theme";
import { type AnalyticsData, type KeyMetricsData } from "@/lib/types";
import { getYearScope } from "@/lib/academic-year";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInCalendarDays, endOfDay, format, parseISO, startOfDay, startOfWeek } from 'date-fns';
import { Filter, Gauge, MessageSquareQuote, Scale, Users } from "lucide-react";

// Minimal shapes used by this page
type Named = { id: number | string; name: string; short_name?: string | null };
type ProfileNamed = { id: string; full_name: string | null; role?: string | null };

type FeedbackSub = {
  submitted_at?: string | null;
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
  course_name?: string | null;
  faculty_id?: string | null;
  prodi_id?: string | null;
  lecturer_id?: string | null;
  term_id?: string | null;
  project_type?: string | null;
  status?: string | null;
  due_date?: string | null;
  faculties?: Named | null;
  prodi?: Named | null;
  lecturers?: Named | null;
  terms?: Named | null;
  feedback_submission?: FeedbackSub | null;
  project_assignments?: { profile_id: string; role: string; profiles?: { id: string; full_name: string | null; role?: string | null } | null }[];
};

type VideoRow = {
  id?: number | null;
  status: string;
  created_at?: string | null;
  duration_minutes?: number | null;
  duration_seconds?: number | null;
  main_editor_id?: string | null;
  updated_at?: string | null;
  /** Per-video deadline; NULL means inherit projects.due_date. */
  due_date?: string | null;
  /** First hand-off to the lecturer, stamped by DB trigger. NULL before tracking existed. */
  delivered_at?: string | null;
  projects?: ProjectJoin | null;
  profiles?: ProfileNamed | null;
};

type Mappable = {
  id: number | string;
  name?: string;
  full_name?: string;
};

const GROUP_LABELS: Record<string, string> = {
  faculty: "faculty",
  prodi: "program",
  lecturer: "lecturer",
  term: "term",
  editor: "editor",
  type: "work type",
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
  const editorIds = toArray(searchParams.editors);

  // --- Academic year default ---
  // The year is not a separate scope here; it is a shortcut that selects its terms. That
  // keeps one mental model — everything on this page is a term filter — and makes the
  // override the obvious thing: change the filter.
  //
  // Note this is STRICTER than the dashboard, which additionally keeps still-running work
  // from earlier years visible as carry-over. Analytics reports on a cohort, so 2026/2027
  // means exactly the projects commissioned in 2026/2027. The two pages can therefore
  // report different live counts for the same year, which is correct but worth stating —
  // the scope note under the title does.
  const yearScope = await getYearScope(supabase);
  const defaultTermIds = yearScope.activeTermIds.map(String);

  // Absent means "not chosen yet" → default to the active year. Present-but-empty means
  // the user cleared it → every year. toArray() collapses both to null, so the raw param
  // is tested first.
  const termsParam = searchParams.terms;
  const termIds = termsParam === undefined && defaultTermIds.length > 0
    ? defaultTermIds
    : toArray(termsParam);
  const usingYearDefault = termsParam === undefined && defaultTermIds.length > 0;

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
            submitted_at,
            created_at
        ),
        project_assignments ( profile_id, role, profiles ( id, full_name, role ) )
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

  const videos: VideoRow[] = (queryRes.data ?? []) as VideoRow[];

  // --- Team Tab Data ---
  // Use all videos that have a main_editor assigned — main_editor_id is set manually
  // so no role filtering is needed; unassigned videos are skipped downstream.
  const teamVideos = videos.filter(v => v.main_editor_id != null);

  const completedVideos = videos.filter((v) => v.status === "Done");

  // --- Feedback / Revision Logs (scoped to the videos already in view) ---
  const videoIds = videos.map(v => v.id).filter((id): id is number => id != null);
  const revisionLogsResult = videoIds.length > 0
    ? await supabase.from("video_feedback_log").select("video_id, status_context, created_at").in("video_id", videoIds)
    : { data: [] as { video_id: number; status_context: string | null; created_at: string | null }[] };
  const revisionLogs = revisionLogsResult.data ?? [];

  // Latest approval per video. This is the only real per-video completion timestamp the schema has —
  // written both when the team marks a video Done and when the lecturer approves it. Used for the
  // completion trend below. See AI_README §11.
  const approvedAtByVideo = new Map<number, number>();
  revisionLogs.forEach(log => {
    if (log.status_context !== 'Approved' || !log.created_at) return;
    const ts = parseISO(log.created_at).getTime();
    const current = approvedAtByVideo.get(log.video_id);
    if (current == null || ts > current) approvedAtByVideo.set(log.video_id, ts);
  });

  // --- Key Metrics ---
  const completedProductionVideos = completedVideos.filter(v => v.projects?.project_type !== 'Translation');
  const totalMinutes = completedProductionVideos.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0);
  const totalSeconds = completedProductionVideos.reduce((acc, v) => acc + (v.duration_seconds ?? 0), 0);

  const uniqueProjectsWithFeedback = new Map<number, number>();
  completedVideos.forEach(v => {
    const rating = v.projects?.feedback_submission?.rating_final_product;
    if (v.projects?.id && rating) {
      uniqueProjectsWithFeedback.set(v.projects.id, rating);
    }
  });

  const totalScore = Array.from(uniqueProjectsWithFeedback.values()).reduce((sum, score) => sum + (Number(score) || 0), 0);
  const avgScore = uniqueProjectsWithFeedback.size > 0 ? totalScore / uniqueProjectsWithFeedback.size : null;

  const videosInReview = videos.filter(v =>
    v.status === 'Review' &&
    v.projects?.status !== 'Pending' &&
    v.projects?.status !== 'Cancelled'
  ).length;

  // Shared definition of "in flight": unfinished, and in a project that is neither
  // parked nor abandoned. Used by the pipeline, the risk buckets and every workload count.
  const isVideoActive = (v: VideoRow) => {
    if (v.status === 'Done') return false;
    const pStatus = v.projects?.status;
    if (pStatus === 'Pending' || pStatus === 'Cancelled') return false;
    return true;
  };

  const activeVideos = videos.filter(isVideoActive);

  // --- Weekly Trend Data for Overview ---
  // Buckets completed videos by the week they were actually approved. This previously read
  // `v.updated_at || v.projects?.created_at`; since videos.updated_at does not exist (AI_README §11)
  // it silently always used the project's REQUEST date, so the chart was not a completion trend at
  // all. Videos with no recorded approval date are excluded rather than dated by proxy — the count
  // is surfaced under the chart so the gap is visible.
  const trendMap: Record<string, { date: string; count: number; sortKey: number }> = {};
  let completedWithoutDate = 0;

  completedVideos.forEach(v => {
    const approvedAt = v.id != null ? approvedAtByVideo.get(v.id) : undefined;
    if (approvedAt == null) {
      completedWithoutDate += 1;
      return;
    }

    // Get start of week (Sunday or Monday depending on locale, default Sunday)
    const weekStart = startOfWeek(new Date(approvedAt));
    const weekLabel = format(weekStart, 'd MMM'); // e.g., "1 Jan", "8 Jan"
    const sortKey = weekStart.getTime();

    if (!trendMap[weekLabel]) {
      trendMap[weekLabel] = { date: weekLabel, count: 0, sortKey };
    }
    trendMap[weekLabel].count += 1;
  });

  const trendData = Object.values(trendMap).sort((a, b) => a.sortKey - b.sortKey);

  // --- Cycle time -----------------------------------------------------------
  // How long a video takes from being logged in the tracker to being approved by the
  // lecturer. The start point is videos.created_at (the earliest per-video timestamp
  // that exists) and the end point is the approval log — the same timestamp the trend
  // chart uses. It is a median rather than a mean because a handful of very old rows
  // would otherwise drag the average somewhere no real video has ever been.
  const cycleDurations = completedVideos
    .map(v => {
      const approvedAt = v.id != null ? approvedAtByVideo.get(v.id) : undefined;
      if (approvedAt == null || !v.created_at) return null;
      const days = differenceInCalendarDays(new Date(approvedAt), parseISO(v.created_at));
      return days >= 0 ? days : null;
    })
    .filter((d): d is number => d != null)
    .sort((a, b) => a - b);

  const medianCycleDays = cycleDurations.length > 0
    ? cycleDurations.length % 2 === 1
      ? cycleDurations[(cycleDurations.length - 1) / 2]
      : (cycleDurations[cycleDurations.length / 2 - 1] + cycleDurations[cycleDurations.length / 2]) / 2
    : null;

  // --- Pipeline snapshot ----------------------------------------------------
  // Where every video in scope currently sits, in workflow order. Videos parked in
  // Pending or Cancelled projects are reported separately — they are not in flight and
  // counting them as "Requested" would overstate the queue.
  const parkedVideos = videos.filter(
    v => v.status !== 'Done' && (v.projects?.status === 'Pending' || v.projects?.status === 'Cancelled')
  ).length;

  const pipelineCounts = new Map<string, number>();
  videos.forEach(v => {
    if (v.status !== 'Done' && !isVideoActive(v)) return; // parked, counted above
    pipelineCounts.set(v.status, (pipelineCounts.get(v.status) ?? 0) + 1);
  });

  const pipelineData: PipelineStage[] = [
    // Known stages first, in real workflow order…
    ...PIPELINE_STAGES.filter(stage => (pipelineCounts.get(stage) ?? 0) > 0).map(stage => ({
      stage,
      count: pipelineCounts.get(stage) ?? 0,
    })),
    // …then anything the enum grows later, so a new status is never silently dropped.
    ...Array.from(pipelineCounts.entries())
      .filter(([stage]) => !PIPELINE_STAGES.includes(stage as (typeof PIPELINE_STAGES)[number]))
      .map(([stage, count]) => ({ stage, count })),
  ];

  // --- Deadline risk --------------------------------------------------------
  // Deadline is the video's own due date where one is set, otherwise the project's —
  // the same rule the on-time table uses, so the two cards never disagree.
  const today = startOfDay(new Date());
  const riskCounts = { overdue: 0, week: 0, month: 0, later: 0, none: 0 };
  const overdueByProject = new Map<number, { courseName: string; dueDate: string | null; daysLate: number; remaining: number }>();

  activeVideos.forEach(v => {
    const deadline = v.due_date ?? v.projects?.due_date ?? null;
    if (!deadline) {
      riskCounts.none += 1;
      return;
    }

    const daysLeft = differenceInCalendarDays(parseISO(deadline), today);
    if (daysLeft < 0) {
      riskCounts.overdue += 1;
      const project = v.projects;
      if (project?.id != null) {
        const existing = overdueByProject.get(project.id);
        overdueByProject.set(project.id, {
          courseName: project.course_name?.trim() || `Project #${project.id}`,
          dueDate: deadline,
          daysLate: Math.max(existing?.daysLate ?? 0, -daysLeft),
          remaining: (existing?.remaining ?? 0) + 1,
        });
      }
    } else if (daysLeft <= 7) {
      riskCounts.week += 1;
    } else if (daysLeft <= 30) {
      riskCounts.month += 1;
    } else {
      riskCounts.later += 1;
    }
  });

  const riskBuckets: RiskBucket[] = [
    { key: "overdue", label: "Past deadline", count: riskCounts.overdue },
    { key: "week", label: "Due within 7 days", count: riskCounts.week },
    { key: "month", label: "Due in 8–30 days", count: riskCounts.month },
    { key: "later", label: "More than 30 days out", count: riskCounts.later },
    { key: "none", label: "No deadline set", count: riskCounts.none },
  ];

  const atRiskProjects: AtRiskProject[] = Array.from(overdueByProject.entries())
    .map(([projectId, p]) => ({
      projectId,
      courseName: p.courseName,
      dueDate: p.dueDate ? format(parseISO(p.dueDate), "d MMM yyyy") : null,
      daysLate: p.daysLate,
      remaining: p.remaining,
    }))
    .sort((a, b) => (b.daysLate ?? 0) - (a.daysLate ?? 0))
    .slice(0, 5);

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
    } else if (isVideoActive(v)) {
      leaderboardMap[editorId].activeVideos += 1;
    }
  });
  const leaderboardData = Object.values(leaderboardMap);

  // Concentration of finished runtime in one person. High is a delivery risk, not a
  // compliment — it means the schedule depends on a single editor staying available.
  const teamMinutes = leaderboardData.reduce((sum, e) => sum + e.minutesProduced, 0);
  const topEditorShare = teamMinutes > 0
    ? Math.max(...leaderboardData.map(e => e.minutesProduced)) / teamMinutes * 100
    : null;
  const activeEditors = leaderboardData.filter(e => e.activeVideos > 0).length;
  const totalActiveAssigned = leaderboardData.reduce((sum, e) => sum + e.activeVideos, 0);

  // --- Sound Engineer Data (separate from editor workload) ---
  type SoundEngineerEntry = { engineerId: string; engineerName: string; completedVideos: number; activeVideos: number; minutesProduced: number };
  const soundEngineerMap: Record<string, SoundEngineerEntry> = {};

  videos.forEach(v => {
    const seAssignment = v.projects?.project_assignments?.find(a => a.role === 'Sound Engineer');
    if (!seAssignment?.profiles?.full_name) return;

    const engineerId = seAssignment.profile_id;
    const engineerName = seAssignment.profiles.full_name;

    if (!soundEngineerMap[engineerId]) {
      soundEngineerMap[engineerId] = { engineerId, engineerName, completedVideos: 0, activeVideos: 0, minutesProduced: 0 };
    }

    if (v.status === 'Done' && v.projects?.project_type !== 'Translation') {
      soundEngineerMap[engineerId].completedVideos += 1;
      soundEngineerMap[engineerId].minutesProduced += (v.duration_minutes || 0) + (v.duration_seconds || 0) / 60;
    } else if (isVideoActive(v)) {
      soundEngineerMap[engineerId].activeVideos += 1;
    }
  });

  const soundEngineerData = Object.values(soundEngineerMap);

  // --- On-Time Delivery Data (per-video, credited to the video's main editor) ---
  // "Delivered" is the first hand-off to the lecturer, i.e. videos.delivered_at, stamped by a DB
  // trigger when a video first enters 'Review'. That moment is entirely within the team's control,
  // unlike lecturer approval or feedback-form submission.
  //
  // The deadline is the video's own due_date when set, otherwise the parent project's — this is what
  // supports classes that need videos weekly or on a staggered schedule. Both are the LATEST agreed
  // dates; renegotiations are surfaced separately via due_date_changes so a lecturer moving a
  // deadline never reads as team lateness. See AI_README §11.
  //
  // delivered_at and videos.due_date are NULL for everything delivered before this tracking existed,
  // so those videos land in `untracked` and are excluded from the rate rather than assumed on time.
  const onTimeMap: Record<string, OnTimeEntry> = {};

  teamVideos.forEach(v => {
    const editorId = v.main_editor_id;
    const editorName = v.profiles?.full_name;
    if (!editorId || !editorName) return;

    // Only count work actually handed over: delivered to the lecturer, or already finished.
    const isHandedOver = v.delivered_at != null || v.status === 'Review' || v.status === 'Done';
    if (!isHandedOver) return;

    if (!onTimeMap[editorId]) {
      onTimeMap[editorId] = { editorId, editorName, measured: 0, onTime: 0, late: 0, untracked: 0 };
    }
    const entry = onTimeMap[editorId];

    const deadline = v.due_date ?? v.projects?.due_date ?? null;
    if (v.delivered_at == null || deadline == null) {
      entry.untracked += 1;
      return;
    }

    // A deadline counts as met through the end of that day.
    entry.measured += 1;
    if (parseISO(v.delivered_at).getTime() <= endOfDay(parseISO(deadline)).getTime()) {
      entry.onTime += 1;
    } else {
      entry.late += 1;
    }
  });

  const onTimeData = Object.values(onTimeMap);

  // Deadline renegotiations across the projects currently in scope. The table lives behind the same
  // filters as everything else, so scope this to the projects we actually loaded.
  const projectIdsInScope = Array.from(
    new Set(videos.map(v => v.projects?.id).filter((id): id is number => id != null))
  );
  const deadlineChangesResult = projectIdsInScope.length > 0
    ? await supabase.from("due_date_changes").select("id", { count: "exact", head: true }).in("project_id", projectIdsInScope)
    : { count: 0 };
  // The table may not exist yet (migration not run) — treat that as "nothing recorded".
  const deadlineChanges = deadlineChangesResult.count ?? 0;

  // --- Feedback Analysis Data ---
  const satisfactionTrendMap: Record<string, { date: string; sum: number; count: number; sortKey: number }> = {};
  const categoryScores = {
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
    { category: 'Pre-production', fullLabel: "Pre-Production", score: categoryScores.pre.count ? categoryScores.pre.sum / categoryScores.pre.count : 0 },
    { category: 'Communication', fullLabel: "Communication", score: categoryScores.comm.count ? categoryScores.comm.sum / categoryScores.comm.count : 0 },
    { category: 'Quality', fullLabel: "Quality", score: categoryScores.qual.count ? categoryScores.qual.sum / categoryScores.qual.count : 0 },
    { category: 'Timeliness', fullLabel: "Timeliness", score: categoryScores.time.count ? categoryScores.time.sum / categoryScores.time.count : 0 },
    { category: 'Final product', fullLabel: "Final Product", score: categoryScores.final.count ? categoryScores.final.sum / categoryScores.final.count : 0 },
  ];

  const feedbackResponses = Math.max(
    categoryScores.pre.count,
    categoryScores.comm.count,
    categoryScores.qual.count,
    categoryScores.time.count,
    categoryScores.final.count
  );

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

    if (video.status === "Done") {
      acc[category].completed_count++;
    } else if (isVideoActive(video)) {
      acc[category].active_count++;
    }

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
  const stackedChartData = Object.values(workloadData).sort((a, b) => {
    const total = (row: typeof a) => Object.entries(row).reduce((sum, [k, v]) => k === 'name' ? sum : sum + (Number(v) || 0), 0);
    return total(b) - total(a);
  });

  // --- Revision Stats (from the logs fetched above) ---
  // Only 'Revision Requested' entries are revisions. This previously counted EVERY log row, so
  // lecturer approvals and ready-for-review notices were being reported as rework — inflating the
  // revision count roughly 5× and correspondingly understating the first-pass approval rate.
  const revisionRequestLogs = revisionLogs.filter(l => l.status_context === 'Revision Requested');
  const totalRevisionRequests = revisionRequestLogs.length;
  const videosWithRevision = new Set(revisionRequestLogs.map(l => l.video_id)).size;
  const revisionRate = completedProductionVideos.length > 0
    ? Math.round((videosWithRevision / completedProductionVideos.length) * 100)
    : 0;

  const keyMetricsData: KeyMetricsData = {
    total_videos_completed: completedProductionVideos.length,
    total_duration_minutes: totalMinutes,
    total_duration_seconds: totalSeconds,
    avg_satisfaction_score: avgScore,
    videos_in_review: videosInReview,
    active_videos: activeVideos.length,
    median_cycle_days: medianCycleDays,
    cycle_sample: cycleDurations.length,
    first_pass_rate: completedProductionVideos.length > 0 ? 100 - revisionRate : null,
    // Last 12 weeks of the trend, for the tile sparkline.
    completion_sparkline: trendData.slice(-12).map(t => t.count),
  };

  const [
    { data: faculties },
    { data: prodi },
    { data: lecturers },
    { data: terms },
    { data: editors },
    { count: unfilteredVideoCount },
  ] = await Promise.all([
    supabase.from("faculties").select("id, name, short_name"),
    supabase.from("prodi").select("id, name"),
    supabase.from("lecturers").select("id, name"),
    supabase.from("terms").select("id, name, academic_year_id"),
    supabase.from("profiles").select("id, full_name"),
    // The "of N" denominator for the scope note. Mirrors the main query's inner join so
    // the two counts are comparable, and is head-only so it costs a count, not a payload.
    supabase.from("videos").select("id, projects!inner(id)", { count: "exact", head: true }),
  ]);

  const totalVideoCount = unfilteredVideoCount ?? videos.length;
  // The active-year default is a scope, not a user filter: flagging it as "Filtered" would
  // cry wolf on every first visit and devalue the badge where it matters. The scope note
  // below names the year instead.
  const isFiltered =
    from != null || to != null ||
    facultyIds != null || prodiIds != null || lecturerIds != null ||
    (termIds != null && !usingYearDefault) || editorIds != null;

  const mapToOptions = (items: Mappable[] | null | undefined) =>
    (items ?? []).map((item) => ({ value: item.id.toString(), label: item.full_name || item.name || "" }));

  // Terms nest under their academic year in the dropdown, so picking a whole year is one
  // click on its heading. The active year sorts first — it is the one being reported on.
  const yearById = new Map(yearScope.years.map(y => [y.id, y]));
  const termOptions = ((terms ?? []) as { id: number; name: string; academic_year_id: number | null }[])
    .map(term => {
      const year = term.academic_year_id != null ? yearById.get(term.academic_year_id) : undefined;
      return {
        value: String(term.id),
        label: term.name,
        group: year?.name,
        // Descending code order puts the newest year at the top, and the active year
        // ahead of everything regardless of age.
        groupOrder: year
          ? (year.is_active ? -1 : 1000 - Number(year.code))
          : undefined,
      };
    });

  const groupLabel = GROUP_LABELS[groupBy] ?? groupBy;
  const tabTrigger =
    "rounded-lg text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all";

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
            {/* Repeated at the title because the toolbar scrolls out of view on long tabs,
                and a screenshot of a filtered chart should still say so. */}
            {isFiltered && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                <Filter className="h-3 w-3" strokeWidth={2.5} />
                Filtered
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {usingYearDefault && yearScope.active && (
              <>
                <span className="font-medium text-gray-700">{yearScope.active.name}</span>
                {" · "}
              </>
            )}
            {isFiltered ? (
              <>
                <span className="font-medium text-gray-700">
                  {videos.length.toLocaleString()} of {totalVideoCount.toLocaleString()} videos
                </span>{" "}
                across {projectIdsInScope.length}{" "}
                {projectIdsInScope.length === 1 ? "project" : "projects"}
              </>
            ) : (
              <>
                All {videos.length.toLocaleString()} videos across {projectIdsInScope.length}{" "}
                {projectIdsInScope.length === 1 ? "project" : "projects"}
              </>
            )}
            {" · "}
            {formatMinutes(totalMinutes + Math.floor(totalSeconds / 60))} of finished runtime ·{" "}
            {leaderboardData.length} credited {leaderboardData.length === 1 ? "editor" : "editors"}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          ← Back to Projects
        </Link>
      </div>

      <FilterStatusProvider>
        <AnalyticsFilters
          faculties={mapToOptions(faculties)}
          prodi={mapToOptions(prodi)}
          lecturers={mapToOptions(lecturers)}
          terms={termOptions}
          editors={mapToOptions(editors)}
          defaultTermIds={defaultTermIds}
          activeYearName={yearScope.active?.name ?? null}
          filteredCount={videos.length}
          totalCount={totalVideoCount}
        />

        <StaleContent>
          <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-gray-100/80 p-1">
          <TabsTrigger value="overview" className={tabTrigger}>Delivery & Flow</TabsTrigger>
          <TabsTrigger value="team" className={tabTrigger}>Team Performance</TabsTrigger>
          <TabsTrigger value="feedback" className={tabTrigger}>Quality & Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <KeyMetrics data={keyMetricsData} />

          <SectionHeading
            title="Flow"
            description="What the team is holding right now, and what is closest to its deadline."
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PipelineFunnel data={pipelineData} parked={parkedVideos} />
            <DeadlineRisk buckets={riskBuckets} atRisk={atRiskProjects} />
          </div>

          <SectionHeading title="Throughput" description="Output over time, and where it lands." />
          {trendData.length > 0 ? (
            <VideoCompletionTrend
              data={trendData}
              title="Videos completed per week"
              excludedCount={completedWithoutDate}
            />
          ) : (
            <EmptyState icon={<Gauge className="h-8 w-8" />} title="No dated completions in scope">
              Videos are plotted by their lecturer-approval date. Nothing in this selection has one yet.
            </EmptyState>
          )}
          <PortfolioBreakdown data={analyticsData} groupLabel={groupLabel} />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatTile
              label="Active assignments"
              value={String(totalActiveAssigned)}
              icon={<Users className="h-4 w-4" />}
              hint={`Held by ${activeEditors} ${activeEditors === 1 ? "editor" : "editors"}${activeEditors > 0 ? `, ${(totalActiveAssigned / activeEditors).toFixed(1)} each on average` : ""}.`}
            />
            <StatTile
              label="Runtime delivered"
              value={formatMinutes(teamMinutes)}
              icon={<Gauge className="h-4 w-4" />}
              hint={`Across ${leaderboardData.length} credited ${leaderboardData.length === 1 ? "editor" : "editors"}.`}
            />
            <StatTile
              label="Busiest editor's share"
              value={topEditorShare == null ? "—" : `${topEditorShare.toFixed(0)}%`}
              tone={topEditorShare == null ? "neutral" : topEditorShare >= 50 ? "warning" : "good"}
              icon={<Scale className="h-4 w-4" />}
              meter={topEditorShare}
              hint="Of all finished runtime. A high share means the schedule leans on one person."
            />
          </div>

          <SectionHeading
            title="Workload"
            description="Editor credit follows the main editor set on each video, never the project assignment."
          />
          <StackedWorkloadChart data={stackedChartData} title="Runtime produced per editor" />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <EditorLeaderboard data={leaderboardData} />
            {soundEngineerData.length > 0 && <SoundEngineerTable data={soundEngineerData} />}
          </div>

          <SectionHeading title="Punctuality" description="Measured from hand-off to the lecturer." />
          <OnTimeDeliveryTable data={onTimeData} deadlineChanges={deadlineChanges} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <SectionHeading
            title="Rework"
            description="How often finished work comes back, and how hard it comes back."
          />
          <RevisionStats
            totalRevisionRequests={totalRevisionRequests}
            videosWithRevision={videosWithRevision}
            revisionRate={revisionRate}
            totalCompleted={completedProductionVideos.length}
          />

          <SectionHeading
            title="Lecturer feedback"
            description="From the form the lecturer fills in once a whole project is finished — project-level, not per video."
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <FeedbackCategoryChart
              data={feedbackCategoryData}
              title="Average score by category"
              responses={feedbackResponses}
            />
            {satisfactionTrendData.length > 1 ? (
              <SatisfactionTrend data={satisfactionTrendData} title="Satisfaction over time" />
            ) : (
              <EmptyState
                icon={<MessageSquareQuote className="h-8 w-8" />}
                title="Not enough feedback for a trend"
                className="h-full"
              >
                A trend needs responses from at least two different weeks.{" "}
                {satisfactionTrendData.length === 1
                  ? "So far there is only one."
                  : "None have come in for this selection."}
              </EmptyState>
            )}
          </div>
        </TabsContent>
          </Tabs>
        </StaleContent>
      </FilterStatusProvider>
    </div>
  );
}
