'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cookieHelper } from '@/lib/cookie-helper';
import { authMfaService } from '@/services/auth-mfa.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getAALFromToken } from '@/lib/token-helper';
import { Loader2, Smartphone } from 'lucide-react';
import { getFriendlyDeviceName } from '@/lib/device-helper';

const AUTH_NEXT_STORAGE_KEY = 'auth_next_path';
const RECOVERY_NEXT_PATH = '/auth/reset-password';
const OTP_LENGTH = 6;

type ApiError = {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

function getSafeNextPath() {
  const nextFromQuery = new URLSearchParams(window.location.search).get('next');
  const nextFromStorage = sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY);
  const nextFromLocalStorage = localStorage.getItem(AUTH_NEXT_STORAGE_KEY);
  const cookieValue: unknown = cookieHelper.get(AUTH_NEXT_STORAGE_KEY);
  const nextPath =
    nextFromQuery ||
    nextFromStorage ||
    nextFromLocalStorage ||
    (typeof cookieValue === 'string' ? cookieValue : null) ||
    '/chat';

  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
    localStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
    cookieHelper.remove(AUTH_NEXT_STORAGE_KEY);
    return '/chat';
  }

  sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
  localStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
  cookieHelper.remove(AUTH_NEXT_STORAGE_KEY);
  return nextPath;
}

function getApiError(error: unknown): ApiError {
  return error && typeof error === 'object' ? error : {};
}

function getErrorCode(errorData: unknown) {
  if (!errorData || typeof errorData !== 'object') return null;

  const { error_code } = errorData as { error_code?: unknown };
  return typeof error_code === 'string' ? error_code : null;
}

export default function MfaPage() {
  const router = useRouter();
  const {
    tokens,
    login,
    logout,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [mfaMode, setMfaMode] = useState<'loading' | 'setup' | 'verify'>(
    'loading'
  );
  const [mfaData, setMfaData] = useState<{
    factorId: string;
    challengeId: string;
    friendlyName?: string;
    qrCode?: string;
    secret?: string;
  } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [mfaCode, setMfaCode] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => '')
  );
  const mfaCodeRef = useRef<string[]>(
    Array.from({ length: OTP_LENGTH }, () => '')
  ); // Ref để truy cập giá trị tức thời trong event handlers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializing = useRef(false);

  // Đồng bộ Ref khi State thay đổi
  useEffect(() => {
    mfaCodeRef.current = mfaCode;
  }, [mfaCode]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const fullCode = mfaCodeRef.current.join('');
      if (fullCode.length !== OTP_LENGTH || !mfaData || !tokens) return;

      setIsSubmitting(true);
      try {
        const verifyData = await authMfaService.verifyMFA(
          mfaData.factorId,
          mfaData.challengeId,
          fullCode,
          tokens.access_token
        );

        // Thành công -> Lưu token aal2 mới
        await login(
          verifyData.access_token,
          verifyData.refresh_token,
          verifyData.expires_in
        );
        const nextPath = getSafeNextPath();
        toast.success(
          nextPath === RECOVERY_NEXT_PATH
            ? 'Xác thực MFA thành công, tiếp tục đặt lại mật khẩu'
            : 'Xác thực MFA thành công'
        );
        router.push(nextPath);
      } catch {
        toast.error('Mã xác thực MFA không chính xác');
      } finally {
        setIsSubmitting(false);
      }
    },
    [mfaData, tokens, login, router]
  );

  // --- OTP input helpers ---

  const handleOtpChange = useCallback(
    (index: number, rawValue: string, prefix: string) => {
      const val = rawValue.replace(/\D/g, '').slice(-1);

      setMfaCode((prev) => {
        const newCode = [...prev];
        newCode[index] = val;
        return newCode;
      });

      // Move focus forward if value is entered
      if (val && index < OTP_LENGTH - 1) {
        document.getElementById(`${prefix}-${index + 1}`)?.focus();
      }
    },
    []
  );

  const handleOtpKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      index: number,
      prefix: string
    ) => {
      if (e.key === 'Backspace') {
        const currentCode = mfaCodeRef.current;
        const currentVal = currentCode[index];

        if (currentVal) {
          // 1. Nếu ô hiện tại có giá trị, chỉ xóa giá trị đó
          setMfaCode((prev) => {
            const newCode = [...prev];
            newCode[index] = '';
            return newCode;
          });
        } else {
          // 2. Nếu ô hiện tại đã trống, tìm ô cuối cùng bên phải có giá trị để xóa
          let lastFilledIdx = -1;
          for (let i = OTP_LENGTH - 1; i > index; i--) {
            if (currentCode[i]) {
              lastFilledIdx = i;
              break;
            }
          }

          if (lastFilledIdx !== -1) {
            // Nếu tìm thấy ô bên phải có số, nhảy đến đó xóa và focus
            setMfaCode((prev) => {
              const newCode = [...prev];
              newCode[lastFilledIdx] = '';
              return newCode;
            });
            document.getElementById(`${prefix}-${lastFilledIdx}`)?.focus();
          } else if (index > 0) {
            // Nếu bên phải trống hết, lùi về ô trước và xóa
            const prevIdx = index - 1;
            setMfaCode((prev) => {
              const newCode = [...prev];
              newCode[prevIdx] = '';
              return newCode;
            });
            document.getElementById(`${prefix}-${prevIdx}`)?.focus();
          }
        }
      }

      if (
        e.key === 'Enter' &&
        mfaCodeRef.current.join('').length === OTP_LENGTH
      ) {
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, prefix: string) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH);
      if (!pasted) return;

      const newCode = [...mfaCodeRef.current];
      pasted.split('').forEach((char, i) => {
        if (i < OTP_LENGTH) newCode[i] = char;
      });
      setMfaCode(newCode);

      // Focus the next empty box or the last box
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      document.getElementById(`${prefix}-${nextIndex}`)?.focus();
    },
    []
  );

  const handleRename = useCallback(
    async (newName: string) => {
      if (
        !mfaData ||
        !tokens ||
        newName === mfaData.friendlyName ||
        !newName.trim()
      )
        return;

      setIsRenaming(true);
      try {
        await authMfaService.updateFactor(
          mfaData.factorId,
          newName,
          tokens.access_token
        );
        setMfaData((prev) =>
          prev ? { ...prev, friendlyName: newName } : null
        );
        toast.success('Đã cập nhật tên thiết bị');
      } catch {
        toast.error('Không thể cập nhật tên thiết bị');
      } finally {
        setIsRenaming(false);
      }
    },
    [mfaData, tokens]
  );

  useEffect(() => {
    const initMfa = async () => {
      if (isInitializing.current) return;

      // Nếu chưa có token thì về login
      if (!isAuthLoading && !tokens?.access_token) {
        router.push('/login');
        return;
      }

      if (!isAuthLoading && tokens?.access_token) {
        isInitializing.current = true;
        try {
          setError(null);
          let factors;
          try {
            factors = await authMfaService.listFactors(tokens.access_token);
          } catch {
            factors = { all: [], active: [] };
          }

          // Redirect to chat only if already aal2 AND has active factors
          const currentAAL = getAALFromToken(tokens.access_token);
          if (currentAAL === 'aal2' && factors.active.length > 0) {
            router.push(getSafeNextPath());
            return;
          }

          if (factors.active && factors.active.length > 0) {
            // 1. Có factor đã xác thực -> Chuyển sang màn hình nhập mã
            const factorId = factors.active[0].id;
            const challenge = await authMfaService.challengeMFA(
              factorId,
              tokens.access_token
            );
            setMfaData({ factorId, challengeId: challenge.id });
            setMfaMode('verify');
          } else if (factors.all && factors.all.length > 0) {
            // 2. Có factor nhưng chưa xác thực (đang bị treo) -> Xóa đi để tạo cái mới
            await authMfaService.unenrollFactor(
              factors.all[0].id,
              tokens.access_token
            );
            // Sau khi xóa thì gọi lại chính hàm này để bắt đầu luồng Enroll mới
            return initMfa();
          } else {
            // 3. Chưa có gì -> Bắt đầu đăng ký mới (Enroll)
            try {
              const suggestedName = getFriendlyDeviceName();
              const enrollData = await authMfaService.enrollMFA(
                tokens.access_token,
                suggestedName
              );

              // Đợi một chút để server kịp đồng bộ Factor mới tạo
              await new Promise((resolve) => setTimeout(resolve, 800));

              const challenge = await authMfaService.challengeMFA(
                enrollData.id,
                tokens.access_token
              );
              setMfaData({
                factorId: enrollData.id,
                challengeId: challenge.id,
                friendlyName: suggestedName,
                qrCode: enrollData.totp.qr_code,
                secret: enrollData.totp.secret,
              });
              setMfaMode('setup');
            } catch (enrollErr: unknown) {
              const errorData = getApiError(enrollErr).response?.data;
              // Xử lý lỗi xung đột tên (mfa_factor_name_conflict)
              if (getErrorCode(errorData) === 'mfa_factor_name_conflict') {
                console.log(
                  'Conflict detected, attempting to clean up and retry...'
                );
                const retryFactors = await authMfaService.listFactors(
                  tokens.access_token
                );
                if (retryFactors.all.length > 0) {
                  await authMfaService.unenrollFactor(
                    retryFactors.all[0].id,
                    tokens.access_token
                  );
                  return initMfa();
                }
              }
              throw enrollErr;
            }
          }
        } catch (err: unknown) {
          const apiError = getApiError(err);
          console.error('MFA Init failed:', err);
          if (apiError.response?.status === 404) {
            setError(
              'Dịch vụ xác thực 2 bước (MFA) chưa được kích hoạt trên hệ thống. Vui lòng liên hệ quản trị viên.'
            );
          } else {
            setError(
              'Có lỗi xảy ra khi khởi tạo xác thực 2 bước: ' +
                (apiError.message || 'Lỗi không xác định')
            );
          }
          setMfaMode('verify'); // Chuyển khỏi mode loading để hiện lỗi
        } finally {
          isInitializing.current = false;
        }
      }
    };

    void initMfa();
  }, [tokens, isAuthenticated, isAuthLoading, router]);

  // Chỗ này đã di chuyển handleSubmit lên trên

  if (mfaMode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Đang chuẩn bị xác thực bảo mật...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-4xl z-10">
        <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
          {error ? (
            <div className="text-center py-10 animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 mb-6">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Lỗi kết nối bảo mật
              </h2>
              <p className="text-slate-400 mb-10 leading-relaxed max-w-md mx-auto">
                {error}
              </p>
              <Button
                onClick={() => {
                  void logout();
                }}
                className="px-10 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
              >
                Quay lại Đăng nhập
              </Button>
            </div>
          ) : mfaMode === 'setup' && mfaData ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-10 text-center">
                <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                  Kích hoạt bảo mật 2 bước
                </h2>
                <p className="text-slate-400 text-lg">
                  Hoàn tất thiết lập để tăng cường an toàn cho tài khoản của
                  bạn.
                </p>
                {mfaData.friendlyName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-400 text-sm font-medium">
                      Đang thiết lập cho: {mfaData.friendlyName}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Cột 1: QR Code & Secret */}
                <div className="space-y-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-[2rem] shadow-2xl shadow-blue-500/20 mb-6 transform hover:scale-105 transition-transform duration-500">
                      <img
                        src={
                          mfaData.qrCode?.startsWith('data:')
                            ? mfaData.qrCode
                            : `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(mfaData.qrCode || '')))}`
                        }
                        alt="MFA QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold">Quét mã QR</p>
                      <p className="text-slate-400 text-sm leading-relaxed px-4">
                        Sử dụng Google Authenticator hoặc ứng dụng tương đương
                        để quét mã.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold text-center">
                      Hoặc nhập mã bí mật thủ công
                    </p>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 group">
                      <code className="text-blue-400 font-mono text-sm break-all flex-1 select-all">
                        {mfaData.secret}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Cột 2: OTP Inputs */}
                <div className="space-y-10 pt-4">
                  {/* Phần đặt tên thiết bị */}
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                      <Smartphone size={20} />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        Tên thiết bị của bạn
                      </span>
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        defaultValue={mfaData.friendlyName}
                        onBlur={(e) => {
                          void handleRename(e.target.value);
                        }}
                        placeholder="Ví dụ: Chrome trên Windows"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl h-14 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all group-hover:border-white/20"
                      />
                      {isRenaming && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Gợi ý: Bạn có thể đặt tên dễ nhớ để quản lý thiết bị này
                      sau này.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-6">
                      <p className="text-white font-semibold pt-1">
                        Nhập mã xác nhận 6 chữ số
                      </p>

                      <div className="flex justify-between gap-2 max-w-sm">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <input
                            key={index}
                            id={`otp-setup-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={mfaCode[index] || ''}
                            onChange={(e) =>
                              handleOtpChange(
                                index,
                                e.target.value,
                                'otp-setup'
                              )
                            }
                            onKeyDown={(e) =>
                              handleOtpKeyDown(e, index, 'otp-setup')
                            }
                            onPaste={(e) => handleOtpPaste(e, 'otp-setup')}
                            className="w-12 h-16 bg-white/10 border border-white/20 rounded-2xl text-center text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={(e) => {
                        void handleSubmit(e);
                      }}
                      disabled={isSubmitting || mfaCode.join('').length !== 6}
                      className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang xác thực...
                        </span>
                      ) : (
                        'Kích hoạt & Tiếp tục'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-blue-600 text-white mb-8 shadow-2xl shadow-blue-600/40 transform hover:rotate-12 transition-transform">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <h2 className="text-4xl font-black text-white mb-3">
                Xác thực OTP
              </h2>
              <p className="text-slate-400 mb-10 text-lg">
                Mở ứng dụng Authenticator để lấy mã bảo mật của bạn.
              </p>

              <div className="w-full max-w-sm space-y-8">
                <div className="flex justify-between gap-2 md:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      id={`otp-verify-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={mfaCode[index] || ''}
                      onChange={(e) =>
                        handleOtpChange(index, e.target.value, 'otp-verify')
                      }
                      onKeyDown={(e) =>
                        handleOtpKeyDown(e, index, 'otp-verify')
                      }
                      onPaste={(e) => handleOtpPaste(e, 'otp-verify')}
                      className="w-12 h-16 md:w-14 md:h-20 bg-white/5 border-2 border-white/10 text-white text-center text-3xl font-bold rounded-2xl focus:border-blue-500 focus:bg-blue-500/10 transition-all outline-none"
                    />
                  ))}
                </div>

                <Button
                  onClick={(e) => {
                    void handleSubmit(e);
                  }}
                  disabled={isSubmitting || mfaCode.join('').length !== 6}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xác thực...
                    </span>
                  ) : (
                    'Xác thực & Đăng nhập'
                  )}
                </Button>

                <button
                  onClick={() => {
                    void logout();
                  }}
                  className="w-full text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors pt-4"
                >
                  Đăng nhập bằng tài khoản khác
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
