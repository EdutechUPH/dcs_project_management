import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, CalendarRange, BookOpen, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AdminSection = {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    adminOnly?: boolean;
    /** Shown top-right when set. Null means no badge. */
    badge?: { label: string; variant: 'destructive' | 'secondary' } | null;
};

export default async function AdminPage() {
    const supabase = await createClient();

    // Get current user role
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    const userRole = profile?.role;

    // Get Pending Users Count (role is null)
    const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .is('role', null);

    // The active year decides what every scoped page reports on, so it belongs on the
    // landing card rather than only inside the year screen. `data` is null when the
    // migration has not been applied, which reads the same as "no year active" — in both
    // cases the app is showing all-time figures and the admin should know.
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('name')
        .eq('is_active', true)
        .maybeSingle();

    const adminSections: AdminSection[] = [
        {
            title: "Manage Users",
            href: "/admin/users",
            icon: Users,
            description: "Add or remove staff and admins.",
            adminOnly: true,
            badge: (pendingCount || 0) > 0
                ? { label: `${pendingCount} Pending`, variant: 'destructive' }
                : null,
        },
        {
            title: "Academic Years & Terms",
            href: "/admin/academic-years",
            icon: CalendarRange,
            description: activeYear
                ? `Reporting on ${activeYear.name}. Add terms and change which year the app scopes to.`
                : "No active year — every page is showing all-time figures.",
            badge: activeYear
                ? { label: activeYear.name, variant: 'secondary' }
                : { label: 'Not set', variant: 'destructive' },
        },
        { title: "Faculties", href: "/admin/faculties", icon: School, description: "Manage university faculties." },
        { title: "Study Programs", href: "/admin/prodi", icon: GraduationCap, description: "Manage study programs (Prodi)." },
        { title: "Lecturers", href: "/admin/lecturers", icon: BookOpen, description: "Manage lecturer database." },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Settings</h1>
            <p className="mt-1.5 text-sm text-gray-500">Master data and application-wide settings.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section) => {
                    // Hide Admin Only sections if not Admin
                    if (section.adminOnly && userRole !== 'Admin') return null;
                    const Icon = section.icon;

                    return (
                        <Link key={section.href} href={section.href}>
                            <Card className="relative h-full cursor-pointer overflow-hidden transition-colors hover:bg-gray-50">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                    <Icon className="h-8 w-8 text-gray-700" />
                                    <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
                                    {section.badge && (
                                        <Badge
                                            variant={section.badge.variant}
                                            className="absolute right-4 top-4 ml-auto"
                                        >
                                            {section.badge.label}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500">{section.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
