import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, BookOpen, School, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

    const adminSections = [
        {
            title: "Manage Users",
            href: "/admin/users",
            icon: Users,
            description: "Add or remove staff and admins.",
            adminOnly: true,
            hasBadge: (pendingCount || 0) > 0,
            badgeCount: pendingCount
        },
        { title: "Faculties", href: "/admin/faculties", icon: School, description: "Manage university faculties." },
        { title: "Study Programs", href: "/admin/prodi", icon: GraduationCap, description: "Manage study programs (Prodi)." },
        { title: "Terms", href: "/admin/terms", icon: Calendar, description: "Configure academic terms." },
        { title: "Lecturers", href: "/admin/lecturers", icon: BookOpen, description: "Manage lecturer database." },
    ];

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminSections.map((section) => {
                    // Hide Admin Only sections if not Admin
                    if (section.adminOnly && userRole !== 'Admin') return null;

                    return (
                        <Link key={section.href} href={section.href}>
                            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full relative overflow-hidden">
                                <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-4">
                                    <section.icon className="w-8 h-8 text-gray-700" />
                                    <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
                                    {section.hasBadge && (
                                        <Badge variant="destructive" className="ml-auto absolute top-4 right-4">
                                            {section.badgeCount} Pending
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
