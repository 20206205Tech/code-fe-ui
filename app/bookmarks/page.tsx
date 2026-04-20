'use client';

import { Sidebar } from '@/components/sidebar';
import { UserMenuHeader } from '@/components/user-menu-header';
import BookmarksManager from '@/components/bookmarks/BookmarksManager';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function BookmarksPage() {
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
        <UserMenuHeader />

        <main className="flex-1 overflow-y-auto pt-16 p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <BookmarksManager />
          </div>
        </main>
      </div>
    </div>
  );
}
