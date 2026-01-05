import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, BookOpen, School } from "lucide-react";

export default function AdminPage() {
    const adminSections = [
        { title: "Manage Users", href: "/admin/users", icon: Users, description: "Add or remove staff and admins." },
        { title: "Faculties", href: "/admin/faculties", icon: School, description: "Manage university faculties." },
        { title: "Study Programs", href: "/admin/prodi", icon: GraduationCap, description: "Manage study programs (Prodi)." },
        { title: "Terms", href: "/admin/terms", icon: Calendar, description: "Configure academic terms." },
        { title: "Lecturers", href: "/admin/lecturers", icon: BookOpen, description: "Manage lecturer database." },
    ];

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminSections.map((section) => (
                    <Link key={section.href} href={section.href}>
                        <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-4">
                                <section.icon className="w-8 h-8 text-gray-700" />
                                <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">{section.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
