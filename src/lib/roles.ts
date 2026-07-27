// src/lib/roles.ts
//
// The role colour scheme from AI_README §9, in one place.
//
// Blue for Digital Content Specialists, purple for Instructional Designers, yellow for
// Admins. It was previously written inline in the new-project form and nowhere else, so
// every other member dropdown in the app was an unsorted grey list — the same people,
// with none of the grouping that makes a name findable.

export type AppRole = 'Digital Content Specialist' | 'Instructional Designer' | 'Admin';

export type RoleTheme = {
  /** Plural heading for a group of this role. */
  groupLabel: string;
  /** Tailwind classes for a group heading — background, text and border. */
  headingClass: string;
  /** Sort position, so groups appear in the same order everywhere. */
  order: number;
};

const THEMES: Record<AppRole, RoleTheme> = {
  'Digital Content Specialist': {
    groupLabel: 'Digital Content Specialists',
    headingClass: 'bg-blue-50/50 text-blue-800 border-blue-100',
    order: 0,
  },
  'Instructional Designer': {
    groupLabel: 'Instructional Designers',
    headingClass: 'bg-purple-50/50 text-purple-800 border-purple-100',
    order: 1,
  },
  Admin: {
    groupLabel: 'Admins',
    headingClass: 'bg-yellow-50/50 text-yellow-800 border-yellow-100',
    order: 2,
  },
};

/**
 * Everyone else — profiles awaiting approval carry a null role. They are kept rather
 * than dropped, because a member filter that silently omits people produces counts
 * nobody can reconcile; they just sort last under a neutral heading.
 */
const UNASSIGNED: RoleTheme = {
  groupLabel: 'Awaiting a role',
  headingClass: 'bg-gray-50 text-gray-600 border-gray-200',
  order: 3,
};

export function roleTheme(role: string | null | undefined): RoleTheme {
  return (role && THEMES[role as AppRole]) || UNASSIGNED;
}

/**
 * Profiles bucketed by role, each bucket sorted alphabetically.
 *
 * For native `<select>` elements, which take `<optgroup>` but cannot be given the role
 * colours — grouping and sorting is the part that actually makes a name findable, and
 * that much works everywhere.
 */
export function groupedProfiles<T extends { full_name: string | null; role?: string | null }>(
  profiles: T[] | null | undefined,
) {
  const buckets = new Map<string, { label: string; order: number; profiles: T[] }>();

  for (const profile of profiles ?? []) {
    const theme = roleTheme(profile.role);
    const bucket = buckets.get(theme.groupLabel)
      ?? { label: theme.groupLabel, order: theme.order, profiles: [] };
    bucket.profiles.push(profile);
    buckets.set(theme.groupLabel, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => a.order - b.order)
    .map(bucket => ({
      ...bucket,
      // trim() before comparing: names come straight from the database and some carry
      // leading whitespace, which otherwise sorts them above every real name.
      profiles: bucket.profiles.sort((a, b) =>
        (a.full_name ?? '').trim().localeCompare((b.full_name ?? '').trim())
      ),
    }));
}

/**
 * Build grouped, alphabetically-sorted dropdown options from a list of profiles.
 *
 * Shared by every member filter so they cannot drift apart: the same people, the same
 * groups, in the same order, whichever page you are on.
 */
export function memberOptions(
  profiles: { id: string; full_name: string | null; role?: string | null }[] | null | undefined,
) {
  return (profiles ?? [])
    .map(p => {
      const theme = roleTheme(p.role);
      return {
        value: String(p.id),
        label: p.full_name ?? '',
        group: theme.groupLabel,
        groupOrder: theme.order,
        groupClass: theme.headingClass,
      };
    })
    // Within a group the CheckboxFilter sorts alphabetically already; this keeps the
    // order stable for any consumer that does not.
    .sort((a, b) => a.groupOrder - b.groupOrder || a.label.trim().localeCompare(b.label.trim()));
}
