// src/components/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/admin/faculties', label: 'Faculties' },
  { href: '/admin/prodi', label: 'Study Programs' },
  { href: '/admin/lecturers', label: 'Lecturers' },
  { href: '/admin/users', label: 'Manage Users' },
  { href: '/admin/terms', label: 'Terms' },
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