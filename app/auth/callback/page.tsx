'use client';

import { Suspense } from 'react';
import { AuthCallbackContent } from './auth-callback-content';

export default function AuthCallbackPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-6 p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-600">Loading authentication...</p>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </main>
  );
}
