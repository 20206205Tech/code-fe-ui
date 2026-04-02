'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const hasAttemptedLogin = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasAttemptedLogin.current) return;
      hasAttemptedLogin.current = true;

      try {
        const errorParam =
          searchParams.get('error') || searchParams.get('error_description');
        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          return;
        }

        const hashString = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hashString);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');

        if (!accessToken || !refreshToken) {
          setError('No access token received');
          return;
        }

        await login(
          accessToken,
          refreshToken,
          expiresIn ? parseInt(expiresIn) : 3600
        );
        router.push('/chat');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, [searchParams, login, router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-6 p-6 max-w-md">
        {error ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
              <p className="text-slate-600">{error}</p>
            </div>
            <p className="text-sm text-slate-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <h1 className="text-xl font-semibold text-slate-900">
              Authenticating...
            </h1>
            <p className="text-sm text-slate-600">
              Please wait while we complete your login
            </p>
          </>
        )}
      </div>
    </main>
  );
}
