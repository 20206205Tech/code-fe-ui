'use client';

import PlansAdmin from '@/components/payment/PlansAdmin';
import { Sidebar } from '@/components/sidebar';
import { UserMenuHeader } from '@/components/user-menu-header';

export default function AdminPlansPage() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-0 overflow-hidden">
        <UserMenuHeader />
        <main className="flex-1 overflow-y-auto pt-16 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <PlansAdmin />
          </div>
        </main>
      </div>
    </div>
  );
}
