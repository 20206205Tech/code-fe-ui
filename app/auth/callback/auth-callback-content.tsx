'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  decodeJwtPayload,
  getUserRoleFromToken,
  getAALFromToken,
} from '@/lib/token-helper';

export function AuthCallbackContent() {
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
          setError(`Xác thực thất bại: ${errorParam}`);
          return;
        }

        const hashString = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hashString);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');

        if (!accessToken || !refreshToken) {
          setError('Không nhận được mã truy cập');
          return;
        }

        const aal = getAALFromToken(accessToken);

        await login(
          accessToken,
          refreshToken,
          expiresIn ? parseInt(expiresIn) : 3600
        );

        const type = hashParams.get('type') || searchParams.get('type');
        if (type === 'recovery') {
          router.push('/auth/reset-password');
        } else if (aal === 'aal1') {
          // Redirect to MFA page
          router.push('/auth/mfa');
        } else {
          router.push('/chat');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Xác thực thất bại');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md">
      {error ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Lỗi</h1>
            <p className="text-slate-600">{error}</p>
          </div>
          <p className="text-sm text-slate-500">
            Đang chuyển hướng đến trang đăng nhập...
          </p>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <h1 className="text-xl font-semibold text-slate-900">
            Đang xác thực...
          </h1>
          <p className="text-sm text-slate-600">
            Vui lòng đợi trong khi chúng tôi hoàn tất đăng nhập
          </p>
        </>
      )}
    </div>
  );
}
