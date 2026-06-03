'use client';

import PersonaAdmin from '@/components/persona/PersonaAdmin';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

export default function AdminPersonasPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/chat');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <div className="max-w-6xl mx-auto">
            <PersonaAdmin />
          </div>
        </main>
      </div>
    </div>
  );
}

