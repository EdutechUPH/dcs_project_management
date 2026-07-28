// src/lib/nav.ts
//
// The app's navigation, in one place.
//
// Extracted from `Sidebar.tsx` once the mobile header needed to name the current page.
// Two lists of routes drift: a page renamed in the sidebar keeps its old name in the
// header, and nobody notices because the two are never on screen at the same time.

import {
  BarChart3,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { title: string; href: string; icon: LucideIcon };

/** The sidebar, in order. */
export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'My Projects', href: '/my-projects', icon: FolderOpen },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  // Next to Analytics because they read the same numbers, but its own destination rather
  // than a tab inside it: analytics is for exploring, this produces a document every
  // member needs their own copy of.
  { title: 'Reports', href: '/reports', icon: FileText },
  { title: 'Team Workload', href: '/workload', icon: Users },
  { title: 'Quality Standard', href: '/quality', icon: ClipboardCheck },
  { title: 'Admin', href: '/admin', icon: Settings },
];

/**
 * Pages the sidebar does not link to but a reader can still be standing on.
 *
 * Longest prefix wins, so `/admin/users` beats `/admin` and the header names the screen
 * rather than the section it belongs to.
 */
const EXTRA_TITLES: Record<string, string> = {
  '/projects/new': 'New project request',
  '/projects': 'Project',
  '/admin/academic-years': 'Academic Years & Terms',
  '/admin/faculties': 'Faculties',
  '/admin/prodi': 'Study Programs',
  '/admin/lecturers': 'Lecturers',
  '/admin/users': 'Manage Users',
  '/onboarding': 'Welcome',
  '/pending-approval': 'Pending approval',
};

/**
 * Routes where navigation is meaningless — nobody is signed in, or the page exists to
 * collect one thing and move on. The mobile header hides itself on these rather than
 * offering a menu that either cannot be used or invites the reader to abandon the form.
 */
const NO_CHROME = ['/login', '/auth', '/feedback', '/onboarding'];

export function hidesAppChrome(pathname: string): boolean {
  return NO_CHROME.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * What to call the screen at this path.
 *
 * Matched by longest prefix rather than exact equality, so `/projects/412` is "Project"
 * and `/admin/lecturers/9/assign` is "Lecturers". The real course name would be better on
 * a project page, but the header renders from the layout and has no access to it — a
 * generic label that is always right beats a specific one that is sometimes blank.
 */
export function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';

  const candidates: Record<string, string> = {
    ...Object.fromEntries(NAV_ITEMS.filter(i => i.href !== '/').map(i => [i.href, i.title])),
    ...EXTRA_TITLES,
  };

  const match = Object.keys(candidates)
    .filter(href => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return match ? candidates[match] : 'DCS Tracker';
}
