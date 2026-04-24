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

  return (
    <Tabs value={statusFilter} className="w-full">
      <TabsList className="grid w-full max-w-[800px] grid-cols-4 bg-gray-100/80 backdrop-blur-sm p-1 rounded-full border border-gray-200 shadow-inner hide-scrollbar">
        <TabsTrigger
          value="ongoing"
          onClick={() => navigate('ongoing')}
          className="w-full rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all hover:bg-white/60 font-medium cursor-pointer"
        >
          Ongoing ({counts.ongoing})
        </TabsTrigger>
        <TabsTrigger
          value="completed"
          onClick={() => navigate('completed')}
          className="w-full rounded-full data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all hover:bg-white/60 font-medium cursor-pointer"
        >
          Completed ({counts.completed})
        </TabsTrigger>
        <TabsTrigger
          value="pending"
          onClick={() => navigate('pending')}
          className="w-full rounded-full data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all hover:bg-white/60 font-medium cursor-pointer"
        >
          Pending ({counts.pending})
        </TabsTrigger>
        <TabsTrigger
          value="cancelled"
          onClick={() => navigate('cancelled')}
          className="w-full rounded-full data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all hover:bg-white/60 font-medium cursor-pointer"
        >
          Cancelled ({counts.cancelled})
        </TabsTrigger>
      </TabsList>

      {/* Content area with loading overlay */}
      <div className="mt-6 relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Loading...
            </div>
          </div>
        )}
        <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          {children}
        </div>
      </div>
    </Tabs>
  );
}
