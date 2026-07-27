import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DashboardFilters from './DashboardFilters';
import NeedsAttention, { type OverdueItem, type ReviewGroup, type UnassignedItem } from './NeedsAttention';
import { type Project } from '@/lib/types';
import { memberOptions } from '@/lib/roles';
import { DataTable } from './projects/data-table/data-table';
import { columns } from './projects/data-table/columns';
import { DashboardStats } from './DashboardStats';
import { Pagination } from '@/components/Pagination';
import StatusTabsClient from './StatusTabsClient';
import { Plus } from 'lucide-react';
import {
  fromEarlierYear,
  getYearScope,
  inActiveYear,
  outOfYearTerm,
  yearLabel,
} from '@/lib/academic-year';

export const revalidate = 0;

// Shape of the lightweight stats query below — enough to bucket projects by status, spot
// what needs attention, and count videos, without pulling the full project payload.
type StatsVideo = {
  status: string;
  title: string | null;
  main_editor_id: string | null;
  delivered_at: string | null;
};

type StatsProject = {
  id: number;
  course_name: string | null;
  due_date: string | null;
  status: string | null;
  faculty_id: number | string | null;
  term_id: number | string | null;
  lecturer_id: number | string | null;
  videos: StatsVideo[] | null;
  project_assignments: { role: string }[] | null;
  // PostgREST returns a one-to-one embed as an object, but has returned an array here
  // historically, so both shapes are handled when reading it.
  feedback_submission: { submitted_at: string | null } | { submitted_at: string | null }[] | null;
};

const MAIN_EDITOR_ROLE = 'Main Editor / Videographer';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  // Pagination Logic
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const itemsPerPage = 10;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  // Status Filter Logic (Default to 'ongoing')
  const statusFilter = resolvedSearchParams.status || 'ongoing';

  // Filters are multi-select and arrive comma-separated. A single legacy value (from a
  // bookmark made before multi-select) parses as a one-element list, so old links still work.
  const toList = (value: string | undefined): string[] | null => {
    const parts = value?.split(',').map(v => v.trim()).filter(Boolean) ?? [];
    return parts.length > 0 ? parts : null;
  };

  const facultyIds = toList(resolvedSearchParams.faculty);
  const termIds = toList(resolvedSearchParams.term);
  const memberIds = toList(resolvedSearchParams.teamMember);
  const lecturerIds = toList(resolvedSearchParams.lecturer);

  // A MISSING `term` means nobody has chosen and the active year applies; a PRESENT but
  // empty one means the reader cleared it and wants every year. toList() collapses both
  // to null, so the raw param is what decides.
  const termParamAbsent = resolvedSearchParams.term === undefined;

  // --- STATS QUERY: respects active dropdown filters (faculty, term, team member) ---
  // For team member, first resolve project IDs via the assignments table
  let statsTeamMemberIds: number[] | null = null;
  if (memberIds) {
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('project_id')
      .in('profile_id', memberIds);
    statsTeamMemberIds = (assignments || []).map(a => a.project_id as number);
  }

  // Fetched unfiltered and narrowed in memory, because the toolbar needs BOTH numbers:
  // the filtered count and the unfiltered total behind "12 of 40 in this tab". Two round
  // trips for that would be wasteful at this table's size.
  const { data: allStatsData } = await supabase
    .from('projects')
    .select('id, course_name, due_date, status, faculty_id, term_id, lecturer_id, videos(status, main_editor_id, title, delivered_at), project_assignments(role), feedback_submission(submitted_at)');

  // Function to determine if a project is considered completed
  const isCompleted = (p: StatsProject) => {
    const fb = Array.isArray(p.feedback_submission) ? p.feedback_submission[0] : p.feedback_submission;
    const hasFeedback = Boolean(fb?.submitted_at);
    return p.status === 'Done' || hasFeedback;
  };

  // Function to determine if a project is considered active
  const isActiveStatus = (p: StatsProject) => {
    if (isCompleted(p)) return false;
    return !['Pending', 'Cancelled'].includes(p.status || 'Active');
  };

  const trackedProjects = (allStatsData ?? []) as StatsProject[];

  // --- ACADEMIC YEAR SCOPE ---
  //
  // A project's term says which term the COURSE is for, not when the work happens. Those
  // come apart in both directions: a 1251 course can still be in production a year later,
  // and a 1262 course is often recorded during 1252. So the year cannot gate what counts
  // as live work — an earlier version of this scoped live projects to the active year
  // plus backwards carry-over only, which silently hid a project people were working on
  // because its term had not started yet.
  //
  // The rule that replaced it:
  //   · UNFINISHED work is always in scope, whatever term it is for — ongoing AND parked
  //     alike. Out-of-year work is labelled (see outOfYearTerm), never hidden.
  //   · COMPLETED work is scoped to the active year, because that is a reporting question
  //     and the term is what a report is about.
  //
  // Parked work counts as unfinished here, and that is deliberate. An earlier version
  // scoped it with the completed work, which meant two Pending projects from 1251 dropped
  // out of the dashboard the moment the year advanced — and the Pending tab is built from
  // this same scope, so there was no view left that could reach them. A Pending project is
  // a decision somebody still owes; it does not expire because a year rolled over.
  //
  // An explicit term filter overrides all of it; see shouldScopeToYear.
  const yearScope = await getYearScope(supabase);
  // Scope only when nobody has expressed a term preference at all. An empty term param
  // is a preference: "every year".
  const scopingToYear = yearScope.active != null && termParamAbsent;

  /** Live work for a term whose year has already passed — behind its intended term. */
  const isBehind = (p: StatsProject) =>
    scopingToYear && isActiveStatus(p) && fromEarlierYear(p, yearScope);

  const inScope = (p: StatsProject) =>
    !scopingToYear || !isCompleted(p) || inActiveYear(p, yearScope);

  const everyProject = trackedProjects.filter(inScope);

  const matchesDimensions = (p: StatsProject) =>
    (!facultyIds || facultyIds.includes(String(p.faculty_id))) &&
    (!termIds || termIds.includes(String(p.term_id))) &&
    (!lecturerIds || lecturerIds.includes(String(p.lecturer_id))) &&
    (statsTeamMemberIds === null || statsTeamMemberIds.includes(p.id));

  const allProjects = everyProject.filter(matchesDimensions);

  // Work running behind its intended term is counted separately from the rest of the
  // queue, so neither number quietly absorbs the other. Work recorded AHEAD of its term
  // is not split out — it is ordinary production, just early, and it stays in Ongoing
  // with a quiet pill rather than being treated as an anomaly.
  const behindProjects = allProjects.filter(isBehind);
  const behindVideos = behindProjects.reduce((acc, p) =>
    acc + (p.videos ?? []).filter(v => v.status !== 'Done').length, 0
  );
  const behindIds = new Set(behindProjects.map(p => p.id));

  // Which year(s) the debt is from. Usually one, but nothing stops work surviving two
  // year-ends, so the label degrades to a count rather than naming the wrong year.
  const behindYears = [
    ...new Set(behindProjects.map(p => yearLabel(p, yearScope)).filter(Boolean)),
  ] as string[];
  const previousYearName =
    behindYears.length === 1 ? behindYears[0]
      : behindYears.length > 1 ? `${behindYears.length} earlier years`
        : null;

  // Every live project in scope, carry-over included. The status TABS read from this, so
  // a carried-over project is still reachable under "Ongoing" — it is live work, and
  // giving it its own card must not make it unclickable everywhere else.
  const globalIncomplete = allProjects.filter(p => isActiveStatus(p));

  // The cards split that total in two: this year's commitment, and last year's debt.
  // Disjoint by construction, so the two figures add back up to globalIncomplete.
  const ongoingProjects = globalIncomplete.filter(p => !behindIds.has(p.id));

  const globalComplete = allProjects.filter(p => isCompleted(p));
  const globalPending = allProjects.filter(p => !isCompleted(p) && p.status === 'Pending');
  const globalCancelled = allProjects.filter(p => !isCompleted(p) && p.status === 'Cancelled');

  // Same buckets, ignoring the dimension filters — the denominator for the scope note.
  const unfilteredTotals: Record<string, number> = {
    ongoing: everyProject.filter(p => isActiveStatus(p)).length,
    completed: everyProject.filter(p => isCompleted(p)).length,
    pending: everyProject.filter(p => !isCompleted(p) && p.status === 'Pending').length,
    cancelled: everyProject.filter(p => !isCompleted(p) && p.status === 'Cancelled').length,
  };

  const overdueProjects = globalIncomplete.filter(p =>
    p.due_date && new Date(p.due_date) < new Date()
  );
  const globalOverdue = overdueProjects.length;

  // The videos actually at stake behind the overdue count. A project one video short of
  // done and a project with 46 outstanding are both "1 overdue" without this.
  const globalOverdueVideos = overdueProjects.reduce((acc, p) =>
    acc + (p.videos ?? []).filter(v => v.status !== 'Done').length, 0
  );

  const undeliveredVideos = (projects: StatsProject[]) =>
    projects.reduce((acc, p) => acc + (p.videos ?? []).filter(v => v.status !== 'Done').length, 0);

  // Videos still owed across everything live, carry-over included — the true size of the
  // production queue. The Ongoing card shows only this year's share of it.
  const globalWipVideos = undeliveredVideos(globalIncomplete);
  const ongoingVideos = undeliveredVideos(ongoingProjects);

  // Videos finished inside the scope, deliberately NOT limited to videos in completed
  // projects. A live project can be a hundred videos deep with more to come, and that
  // delivered work is real. Pending and Cancelled are excluded so this counts the same
  // universe of work as the completion percentage beside it.
  const globalCompletedVideos = allProjects
    .filter(p => !behindIds.has(p.id) && !['Pending', 'Cancelled'].includes(p.status || 'Active'))
    .reduce((acc, p) => acc + (p.videos ?? []).filter(v => v.status === 'Done').length, 0);

  // --- NEEDS ATTENTION: triage lists, live projects only ---
  const now = new Date();
  const daysSince = (iso: string) => Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000));

  const overdueItems: OverdueItem[] = globalIncomplete
    .filter(p => p.due_date && new Date(p.due_date) < now)
    .map(p => ({
      projectId: p.id,
      courseName: p.course_name ?? `Project ${p.id}`,
      daysLate: daysSince(p.due_date!),
      remaining: (p.videos ?? []).filter(v => v.status !== 'Done').length,
      // Present only when the term sits outside the active year, so the pill appears
      // where it informs. Overdue and out-of-year are independent facts: a project can be
      // late for a term that has not even started.
      outOfYearTerm: scopingToYear ? outOfYearTerm(p, yearScope) : null,
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  // Every video sitting with a lecturer, whether or not its wait can be measured, grouped
  // by course. Chasing is one conversation per lecturer rather than per video — 20 videos
  // in review turned out to be 2 courses, and a preview of four video titles from the same
  // course read as four separate courses.
  //
  // delivered_at only exists for hand-offs made after delivery tracking was added, so older
  // ones contribute no measurable wait — the video is still in the queue and must be
  // counted. Excluding them made the headline read 0 while videos were plainly in Review.
  const reviewByProject = new Map<number, ReviewGroup>();
  globalIncomplete.forEach(p => {
    (p.videos ?? []).forEach(v => {
      if (v.status !== 'Review') return;
      const group = reviewByProject.get(p.id) ?? {
        projectId: p.id,
        courseName: p.course_name ?? `Project ${p.id}`,
        videoCount: 0,
        longestWait: null,
        undatedCount: 0,
      };
      group.videoCount++;
      const waited = v.delivered_at ? daysSince(v.delivered_at) : null;
      if (waited == null) group.undatedCount++;
      else group.longestWait = Math.max(group.longestWait ?? 0, waited);
      reviewByProject.set(p.id, group);
    });
  });

  // Longest measurable wait first, then the biggest pile. Undated groups sort after dated
  // ones rather than to zero — unknown is not the same as "just sent".
  const reviewGroups = [...reviewByProject.values()].sort(
    (a, b) => (b.longestWait ?? -1) - (a.longestWait ?? -1) || b.videoCount - a.videoCount
  );
  const reviewVideoCount = reviewGroups.reduce((sum, g) => sum + g.videoCount, 0);
  const reviewUndated = reviewGroups.reduce((sum, g) => sum + g.undatedCount, 0);

  // A video with no main_editor_id is NOT necessarily unassigned: when the per-video override
  // is empty the project's 'Main Editor / Videographer' assignment stands in, and that is what
  // the project page shows. Only a video with neither is genuinely nobody's job. Testing the
  // video column alone reported 31 unassigned videos that all had an editor.
  const unassignedItems: UnassignedItem[] = globalIncomplete
    .filter(p => !(p.project_assignments ?? []).some(a => a.role === MAIN_EDITOR_ROLE))
    .map(p => ({
      projectId: p.id,
      courseName: p.course_name ?? `Project ${p.id}`,
      count: (p.videos ?? []).filter(v => v.status !== 'Done' && !v.main_editor_id).length,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // Separate and much softer signal: videos that lean on the project-level editor rather than
  // naming one. They are covered operationally, but analytics credits editing work per video
  // (AI_README §8), so this work will not be credited to anyone until an editor is set.
  const inheritedEditorVideos = globalIncomplete
    .filter(p => (p.project_assignments ?? []).some(a => a.role === MAIN_EDITOR_ROLE))
    .reduce((sum, p) => sum + (p.videos ?? []).filter(v => v.status !== 'Done' && !v.main_editor_id).length, 0);

  // --- MAIN DATA QUERY ---
  let query = supabase
    .from('projects')
    .select('*, created_at, due_date, lecturers(name), prodi(name), videos(*, profiles(full_name)), project_assignments(*, profiles(full_name)), feedback_submission(submitted_at)', { count: 'exact' });

  // 1. Text Search
  if (resolvedSearchParams.query) {
    query = query.ilike('course_name', `%${resolvedSearchParams.query}%`);
  }

  // 2. Dropdown Filters
  if (facultyIds) {
    query = query.in('faculty_id', facultyIds);
  }
  if (termIds) {
    query = query.in('term_id', termIds);
  }
  // No filter on project_assignments here, deliberately. Filtering an embedded resource
  // without !inner does NOT narrow the parent rows — it strips the embed down to matching
  // children, which made the "Main Editor/Videographer" column read "Unassigned" on every
  // row whenever a member filter was active. The member narrowing is already applied
  // correctly through validProjectIds below, computed from statsTeamMemberIds.

  // 3. Status Filtering using pre-computed IDs
  let validProjectIds: number[] = [];
  if (statusFilter === 'completed') {
    validProjectIds = globalComplete.map(p => p.id);
  } else if (statusFilter === 'pending') {
    validProjectIds = globalPending.map(p => p.id);
  } else if (statusFilter === 'cancelled') {
    validProjectIds = globalCancelled.map(p => p.id);
  } else {
    validProjectIds = globalIncomplete.map(p => p.id);
  }

  // The stat cards deliberately do NOT filter this table. Clicking one used to hide every
  // other project, which is the opposite of what a dashboard is for: the list is the work,
  // and a summary tile should not be able to take most of it away. The cards summarise;
  // the tabs and the filter bar are what narrow.
  if (validProjectIds.length > 0) {
    query = query.in('id', validProjectIds);
  } else {
    query = query.eq('id', -1);
  }

  // Apply Range for Pagination
  const { data: projects, error, count } = await query
    .order('due_date', { ascending: true })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / itemsPerPage);


  // Tag the rows the table will render, so a project for a term outside the active year
  // explains itself in place rather than looking like a stray.
  const tableRows = ((projects ?? []) as Project[]).map(p => ({
    ...p,
    outOfYearTerm: scopingToYear ? outOfYearTerm({ term_id: p.term_id }, yearScope) : null,
  }));

  // Fetch filter options
  const { data: faculties } = await supabase.from('faculties').select('id, name');
  const { data: terms } = await supabase.from('terms').select('id, name, academic_year_id');
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
  const { data: lecturers } = await supabase.from('lecturers').select('id, name');

  // Terms nest under their academic year in the dropdown, so picking a whole year is one
  // click on its heading rather than knowing which three codes belong to it. The active
  // year sorts first; the rest run newest to oldest.
  const yearById = new Map(yearScope.years.map(y => [y.id, y]));
  const termOptions = (terms ?? []).map(t => {
    const year = t.academic_year_id != null ? yearById.get(t.academic_year_id) : undefined;
    return {
      value: String(t.id),
      label: t.name,
      group: year?.name,
      groupOrder: year ? (year.is_active ? -1 : 1000 - Number(year.code)) : undefined,
    };
  });

  if (error) {
    console.error("Dashboard fetch error:", error);
    return <p>Error fetching projects: {error.message}</p>;
  }

  return (
    <div className="space-y-6 p-8">
      {/* Title leads, then the numbers. The old order opened with four cards and only said
          what the page was underneath them. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Projects</h1>
          {/* The scope is stated, never implied. A reader who does not know an academic
              year is being applied would otherwise read these figures as all-time. */}
          <p className="text-sm text-gray-500">
            {scopingToYear && yearScope.active && (
              <span className="font-medium text-gray-700">{yearScope.active.name}</span>
            )}
            {scopingToYear && yearScope.active && " · "}
            {globalIncomplete.length} ongoing · {globalWipVideos} videos in production ·{" "}
            {globalComplete.length} completed
            {behindProjects.length > 0 && (
              <>
                {" · "}
                <span className="text-amber-700">
                  including {behindProjects.length} behind their term
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          New project request
        </Link>
      </div>

      {/* Above everything it controls. These filters narrow the four stat cards and the
          triage panel as well as the table, but sat underneath both — so picking a faculty
          changed four numbers that were off the top of the screen, with the control that
          changed them out of sight below. */}
      <DashboardFilters
        faculties={(faculties ?? []).map(f => ({ value: String(f.id), label: f.name }))}
        terms={termOptions}
        teamMembers={memberOptions(profiles)}
        lecturers={(lecturers ?? []).map(l => ({ value: String(l.id), label: l.name ?? '' }))}
        activeYearName={scopingToYear ? yearScope.active?.name ?? null : null}
        activeYearTermIds={yearScope.activeTermIds.map(String)}
        filteredCount={count ?? 0}
        totalCount={unfilteredTotals[statusFilter] ?? 0}
      />

      <DashboardStats
        totalActive={ongoingProjects.length}
        videosInProduction={ongoingVideos}
        behindProjects={behindProjects.length}
        behindVideos={behindVideos}
        behindFromYear={behindProjects.length > 0 ? previousYearName : null}
        overdueProjects={globalOverdue}
        overdueVideos={globalOverdueVideos}
        totalCompleted={globalComplete.length}
        videosCompleted={globalCompletedVideos}
        activeYearName={scopingToYear ? yearScope.active?.name ?? null : null}
      />

      <NeedsAttention
        overdue={overdueItems}
        inReview={reviewGroups}
        reviewVideoCount={reviewVideoCount}
        unassigned={unassignedItems}
        reviewUndated={reviewUndated}
        inheritedEditorVideos={inheritedEditorVideos}
      />

      <StatusTabsClient
        statusFilter={statusFilter}
        counts={{
          ongoing: globalIncomplete.length,
          completed: globalComplete.length,
          pending: globalPending.length,
          cancelled: globalCancelled.length,
        }}
      >
        <DataTable columns={columns} data={tableRows} />
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
          />
        </div>
      </StatusTabsClient>
    </div>
  );
}
