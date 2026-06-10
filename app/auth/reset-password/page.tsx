'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/services/auth-user.service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { tokens } = useAuth();
  const accessToken = tokens?.access_token;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      if (!accessToken) {
        throw new Error('Phiên làm việc không hợp lệ. Vui lòng thử lại.');
      }
      await authService.updateUserPassword(accessToken, password);
      toast.success('Đổi mật khẩu thành công');
      router.push('/chat');
    } catch (error: any) {
      let errorMessage = error.message || 'Không thể đổi mật khẩu';
      if (
        error.errorCode === 'same_password' ||
        errorMessage.includes('different from the old password')
      ) {
        errorMessage = 'Mật khẩu mới không được trùng với mật khẩu cũ.';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden p-6">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f611,transparent_50%)]"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] rounded-3xl p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-6 shadow-lg shadow-blue-500/20">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Đặt lại Mật khẩu
            </h1>
            <p className="text-slate-400">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                Mật khẩu mới
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                Xác nhận mật khẩu
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all duration-300 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 mt-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Đang cập nhật...
                </span>
              ) : (
                'Cập nhật Mật khẩu'
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
