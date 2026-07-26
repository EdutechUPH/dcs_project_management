// src/app/StatusTabsClient.tsx
'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

type StatusTabsClientProps = {
  statusFilter: string;
  counts: {
    ongoing: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  children: React.ReactNode;
};

export default function StatusTabsClient({ statusFilter, counts, children }: StatusTabsClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (status: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('status', status);
      params.delete('page'); // Reset to page 1 on tab switch
      router.push('?' + params.toString());
    });
  };

  // Square tabs matching the analytics tab bar, rather than the old pill rail — same
  // component, same shape, so the two pages read as one product. The count sits in a
  // subdued chip so the tab label stays the thing you scan for.
  const TABS: { value: string; label: string; count: number }[] = [
    { value: 'ongoing', label: 'Ongoing', count: counts.ongoing },
    { value: 'completed', label: 'Completed', count: counts.completed },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <Tabs value={statusFilter} className="w-full">
      <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl bg-gray-100/80 p-1 sm:max-w-[640px]">
        {TABS.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            onClick={() => navigate(tab.value)}
            className="cursor-pointer gap-1.5 rounded-lg text-sm font-medium text-gray-600 transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            {tab.label}
            <span className="text-xs tabular-nums text-gray-400">{tab.count}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Content area with loading overlay */}
      <div className="relative mt-6">
        {isPending && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-2 text-xs font-medium text-blue-900 shadow-lg">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading projects…
            </span>
          </div>
        )}
        <div
          className={
            isPending
              ? 'select-none opacity-50 blur-[3px] saturate-50 transition-[filter,opacity] duration-200 motion-reduce:blur-none motion-reduce:saturate-100'
              : 'transition-[filter,opacity] duration-200'
          }
          aria-busy={isPending}
        >
          {children}
        </div>
      </div>
    </Tabs>
  );
}
