import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const toArray = (value: string | null): string[] | null => {
        if (!value) return null;
        return value.split(",");
    };

    // --- Read all filters from the URL ---
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const facultyIds = toArray(searchParams.get('faculties'));
    const prodiIds = toArray(searchParams.get('prodi'));
    const lecturerIds = toArray(searchParams.get('lecturers'));
    const termIds = toArray(searchParams.get('terms'));
    const editorIds = toArray(searchParams.get('editors'));

    // --- Query videos + related project/editor info ---
    // Using the same query structure as AnalyticsPage to ensure consistency
    let query = supabase
        .from("videos")
        .select(
            `
      *,
      projects!inner (
        *,
        faculties ( name, short_name ),
        prodi ( name ),
        lecturers ( name ),
        terms ( name )
      ),
      profiles ( full_name )
    `
        );

    // Apply filters
    if (from) query = query.gte("projects.created_at", from);
    if (to) query = query.lte("projects.created_at", to);
    if (facultyIds) query = query.in("projects.faculty_id", facultyIds);
    if (prodiIds) query = query.in("projects.prodi_id", prodiIds);
    if (lecturerIds) query = query.in("projects.lecturer_id", lecturerIds);
    if (termIds) query = query.in("projects.term_id", termIds);
    if (editorIds) query = query.in("main_editor_id", editorIds);

    const { data: videos, error } = await query;

    if (error) {
        console.error("Error exporting analytics data:", error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // --- Convert to CSV ---
    // Define CSV Headers
    const csvHeaders = [
        'Video ID',
        'Title',
        'Status',
        'Project ID',
        'Course Name',
        'Project Created At',
        'Due Date',
        'Faculty',
        'Study Program',
        'Lecturer',
        'Term',
        'Main Editor',
        'Duration (Min)',
        'Duration (Sec)',
        'Language',
        'Project Type'
    ];

    // Map data to rows
    const csvRows = videos.map((v: any) => {
        // Helper to safely handle commas in values by wrapping in quotes
        const safe = (val: any) => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        return [
            safe(v.id),
            safe(v.title),
            safe(v.status),
            safe(v.project_id),
            safe(v.projects?.course_name),
            safe(v.projects?.created_at),
            safe(v.projects?.due_date),
            safe(v.projects?.faculties?.short_name || v.projects?.faculties?.name),
            safe(v.projects?.prodi?.name),
            safe(v.projects?.lecturers?.name),
            safe(v.projects?.terms?.name),
            safe(v.profiles?.full_name || 'Unassigned'),
            safe(v.duration_minutes),
            safe(v.duration_seconds),
            safe(v.language),
            safe(v.projects?.project_type || 'Editing'),
        ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    // Return CSV Response
    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="analytics_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
    });
}
