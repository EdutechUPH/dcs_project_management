// src/app/admin/layout.tsx
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="border rounded-lg p-6 bg-white">
          {children}
        </div>
      </main>
    </div>
  );
}