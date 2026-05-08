'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useAuth } from '@/lib/auth-context';

function SuccessContent() {
  const router = useRouter();
  const { syncSubscription } = useAuth();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Sync subscription status immediately
    syncSubscription();

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      router.push('/chat');
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full animate-in fade-in zoom-in duration-500">
        <Card className="border-none shadow-none bg-transparent flex flex-col items-center">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
              Thành công!
            </h1>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-6 whitespace-nowrap">
              Đang tự động chuyển hướng về trang chủ...
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-full whitespace-nowrap">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chuyển hướng sau {countdown}s</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
