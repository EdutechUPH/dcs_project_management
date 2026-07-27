// src/components/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  // Terms live inside this screen; they have no page of their own so that one can never
  // be created without a year.
  { href: '/admin/academic-years', label: 'Academic Years & Terms' },
  { href: '/admin/faculties', label: 'Faculties' },
  { href: '/admin/prodi', label: 'Study Programs' },
  { href: '/admin/lecturers', label: 'Lecturers' },
  { href: '/admin/users', label: 'Manage Users' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-50 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Admin Menu</h2>
      <nav>
        <ul>
          {navLinks.map(link => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.href} className="mb-1">
                <Link
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}