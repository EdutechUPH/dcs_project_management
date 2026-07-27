// src/app/admin/terms/page.tsx
//
// Terms are managed inside their academic year now — see /admin/academic-years. This
// route survives only so existing links and bookmarks keep working; the standalone
// "add term" form it used to host is what allowed a term to be created with no year,
// which silently drops its projects out of every scoped page.
import { redirect } from 'next/navigation';

export default function TermsPage() {
  redirect('/admin/academic-years');
}
