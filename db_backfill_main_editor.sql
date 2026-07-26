-- ============================================================================
-- Backfill videos.main_editor_id from the project's Main Editor assignment
-- Run this in the Supabase SQL Editor.
--
-- WHY
-- Analytics credits editing work per video through videos.main_editor_id and ignores
-- project_assignments entirely (AI_README section 8). createProject() used to insert its
-- videos with a NULL main_editor_id and then write project_assignments straight to the
-- table, bypassing the IS NULL back-fill inside assignTeamMember(). Those videos were
-- therefore credited to NOBODY in the Editor Scorecard, the runtime-per-editor chart and
-- the On-Time Delivery table -- while the project page still showed the project-level
-- editor as a fallback, so nothing looked wrong.
--
-- The code path is fixed in src/app/projects/new/actions.ts. This repairs the rows that
-- were already created.
--
-- SCOPE: only videos with NO editor of their own, in projects that DO have exactly the
-- Main Editor assignment to inherit. Videos with an explicit editor are never touched --
-- a per-video override always wins, which is the whole point of section 8.
--
-- Safe to run more than once: the WHERE clause matches nothing on a second pass.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Preview -- run this FIRST and check the list looks right
-- ---------------------------------------------------------------------------
SELECT
    p.id                AS project_id,
    p.course_name,
    COUNT(v.id)         AS videos_to_update,
    pr.full_name        AS will_be_credited_to
FROM public.videos v
JOIN public.projects p ON p.id = v.project_id
JOIN public.project_assignments pa
    ON pa.project_id = p.id
   AND pa.role = 'Main Editor / Videographer'
JOIN public.profiles pr ON pr.id = pa.profile_id
WHERE v.main_editor_id IS NULL
GROUP BY p.id, p.course_name, pr.full_name
ORDER BY p.id;

-- Expected as of July 2026:
--   67  Strategi Media Sosial        16  Christiadi Nugroho
--   68  Urusan Publik dan Advokasi   15  Yohanes Adi Saputra Abraham

-- ---------------------------------------------------------------------------
-- 2. The backfill
-- ---------------------------------------------------------------------------
-- The subquery takes a single assignment per project. A project with two people recorded
-- against the Main Editor role would otherwise multiply the rows; LIMIT 1 with a stable
-- ORDER BY makes the choice deterministic and matches addVideoToProject()'s .limit(1).
UPDATE public.videos v
SET main_editor_id = (
        SELECT pa.profile_id
        FROM public.project_assignments pa
        WHERE pa.project_id = v.project_id
          AND pa.role = 'Main Editor / Videographer'
        ORDER BY pa.created_at, pa.id
        LIMIT 1
    )
WHERE v.main_editor_id IS NULL
  AND EXISTS (
        SELECT 1
        FROM public.project_assignments pa
        WHERE pa.project_id = v.project_id
          AND pa.role = 'Main Editor / Videographer'
    );

-- ---------------------------------------------------------------------------
-- 3. Verify -- expect 0 rows remaining that could have inherited an editor
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS still_null_but_inheritable
FROM public.videos v
WHERE v.main_editor_id IS NULL
  AND EXISTS (
        SELECT 1
        FROM public.project_assignments pa
        WHERE pa.project_id = v.project_id
          AND pa.role = 'Main Editor / Videographer'
    );

-- Videos in projects with no Main Editor assignment at all stay NULL on purpose: there is
-- nobody to inherit from, and the dashboard's "No main editor" column is what surfaces them.
SELECT COUNT(*) AS still_null_with_nobody_to_inherit
FROM public.videos v
WHERE v.main_editor_id IS NULL;
