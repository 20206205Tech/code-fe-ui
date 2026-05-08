'use client';

import { Sidebar } from '@/components/sidebar';
import SharesManager from '@/components/shares/SharesManager';
import { Suspense } from 'react';

export default function SharesPage() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
        }
      >
        <Sidebar />
      </Suspense>

      <div className="flex-1 flex flex-col md:ml-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-4 p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            <SharesManager />
          </div>
        </main>
      </div>
    </div>
  );
}
