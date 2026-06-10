'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { getAALFromToken } from '@/lib/token-helper';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authService } from '../../services/auth-user.service';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isMfaRequired, isLoading, login, tokens } =
    useAuth();

  const [authMode, setAuthMode] = useState<
    'login' | 'signup' | 'forgot-password' | 'verify-email'
  >('login');

  const AUTH_CONTENT = {
    login: {
      title: 'Đăng nhập',
      description: 'Nhập thông tin của bạn để truy cập tài khoản',
    },
    signup: {
      title: 'Tạo tài khoản',
      description: 'Bắt đầu hành trình của bạn cùng chúng tôi',
    },
    'forgot-password': {
      title: 'Đặt lại mật khẩu',
      description: 'Nhập email để nhận liên kết khôi phục mật khẩu',
    },
  } as const;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/chat');
      } else if (isMfaRequired) {
        router.push('/auth/mfa');
      }
    }
  }, [isAuthenticated, isMfaRequired, isLoading, router]);

  const handleGoogleLogin = () => {
    authService.loginWithGoogle();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoadingAction(true);
    try {
      if (authMode === 'login') {
        if (!password) return;
        const data = await authService.loginWithEmailPassword(email, password);

        // Sau khi login pass thành công, check xem có cần MFA không
        const aal = getAALFromToken(data.access_token);

        if (aal === 'aal1') {
          // Lưu token tạm vào AuthContext thông qua hàm login nhưng chưa được coi là authenticated (vì aal1)
          await login(data.access_token, data.refresh_token, data.expires_in);
          router.push('/auth/mfa');
        } else {
          await login(data.access_token, data.refresh_token, data.expires_in);
          router.push('/chat');
        }
      } else if (authMode === 'signup') {
        if (!password) return;
        await authService.signUp(email, password);
        setAuthMode('verify-email');
      } else if (authMode === 'forgot-password') {
        await authService.recoverPassword(email);
        setAuthMode('verify-email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Thao tác thất bại');
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f644,transparent_50%)]"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium animate-pulse">
            Đang tải trải nghiệm...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden p-6">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f611,transparent_50%)]"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] rounded-3xl p-8 md:p-10">
          {authMode === 'verify-email' ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-8 border border-blue-500/20">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {email.includes('recover')
                  ? 'Khôi phục Mật khẩu'
                  : 'Xác nhận Email'}
              </h1>
              <p className="text-slate-400 mb-10 leading-relaxed">
                Chúng tôi đã gửi liên kết {password ? 'xác nhận' : 'khôi phục'}{' '}
                đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư của bạn.
              </p>
              <Button
                onClick={() => {
                  setAuthMode('login');
                  setPassword('');
                }}
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl transition-all"
              >
                Quay lại Đăng nhập
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                  {AUTH_CONTENT[authMode as keyof typeof AUTH_CONTENT].title}
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">
                    Địa chỉ Email
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                {authMode !== 'forgot-password' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-medium text-slate-300">
                        Mật khẩu
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot-password')}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoadingAction}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all duration-300 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoadingAction ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Đang xử lý...
                    </span>
                  ) : (
                    <>
                      {authMode === 'login' && 'Đăng nhập'}
                      {authMode === 'signup' && 'Đăng ký'}
                      {authMode === 'forgot-password' && 'Gửi Email Khôi phục'}
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center mb-8">
                {authMode === 'login' ? (
                  <p className="text-sm text-slate-400">
                    Chưa có tài khoản?{' '}
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Tạo tài khoản mới
                    </button>
                  </p>
                ) : (
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Quay lại Đăng nhập
                  </button>
                )}
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-4 text-slate-500 backdrop-blur-sm">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all duration-300 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Tiếp tục với Google</span>
              </Button>

              <p className="mt-10 text-xs text-slate-500 text-center leading-relaxed max-w-[280px] mx-auto">
                Bằng cách đăng nhập, bạn đồng ý với{' '}
                <a
                  href="#"
                  className="text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Điều khoản Dịch vụ
                </a>{' '}
                và{' '}
                <a
                  href="#"
                  className="text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Chính sách Bảo mật
                </a>{' '}
                của chúng tôi.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
