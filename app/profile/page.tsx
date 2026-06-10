'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/services/auth.service';
import { authMfaService } from '@/services/auth-mfa.service';
import {
  ArrowLeft,
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, Suspense, useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const { user, updateUser, tokens } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  // States for change password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // States for MFA
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isLoadingMfa, setIsLoadingMfa] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadMfaStatus = useCallback(async () => {
    if (!tokens?.access_token) return;
    setIsLoadingMfa(true);
    try {
      const factors = await authMfaService.listFactors(tokens.access_token);
      setMfaFactors(factors.active || []);
    } catch (error) {
      console.error('Failed to load MFA status:', error);
    } finally {
      setIsLoadingMfa(false);
    }
  }, [tokens]);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.avatar) setAvatarUrl(user.avatar);
  }, [user]);

  useEffect(() => {
    if (tokens?.access_token) {
      loadMfaStatus();
    }
  }, [tokens, loadMfaStatus]);

  const handleUnenrollMFA = async (factorId: string) => {
    if (!tokens?.access_token) return;
    setIsActionLoading(true);
    try {
      await authMfaService.unenrollFactor(factorId, tokens.access_token);
      sonnerToast.success('Đã hủy liên kết thiết bị xác thực');
      await loadMfaStatus();
    } catch (error: any) {
      sonnerToast.error(
        'Không thể hủy liên kết: ' + (error.message || 'Lỗi không xác định')
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdate = async (data: {
    name?: string;
    avatarFile?: File;
    avatar?: string;
  }) => {
    setIsLoading(true);
    try {
      await updateUser(data);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Thao tác thất bại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) return;

    if (newPassword.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu phải chứa ít nhất 6 ký tự.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const accessToken = tokens?.access_token;
      if (!accessToken) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      await authService.updateUserPassword(accessToken, newPassword);
      toast({
        title: 'Thành công',
        description: 'Mật khẩu của bạn đã được cập nhật thành công.',
        variant: 'success',
      });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      let errorMessage = error.message || 'Không thể đổi mật khẩu';
      if (
        error.errorCode === 'same_password' ||
        errorMessage.includes('different from the old password')
      ) {
        errorMessage = 'Mật khẩu mới không được trùng với mật khẩu cũ.';
      }
      toast({
        title: 'Thất bại',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto py-8">
          <div className="w-full max-w-md mx-auto px-4 space-y-8 flex flex-col items-center">
            {/* Nút quay lại & Tiêu đề */}
            <div className="w-full flex items-center justify-between">
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Quay lại
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Trang cá nhân</h1>
              <div className="w-10" /> {/* Để cân bằng layout */}
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                    alt="avatar"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-transform active:scale-95"
                >
                  <Upload size={16} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUpdate({ avatarFile: e.target.files[0] })
                }
                className="hidden"
              />
            </div>

            {/* Form Section */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate({ name, avatar: avatarUrl });
              }}
              className="w-full space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl shadow-sm"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 px-1">
                  Họ và tên
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên của bạn"
                  className="bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 px-1">
                  Đường dẫn ảnh đại diện (URL)
                </label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 px-1">
                  Email
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  readOnly
                  className="bg-slate-100/50 opacity-70 cursor-not-allowed"
                />
              </div>

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (name === user?.name && avatarUrl === user?.avatar) ||
                  !name.trim()
                }
                className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              >
                {isLoading ? 'Đang xử lý...' : 'Lưu thay đổi'}
              </Button>
            </form>

            {/* Change Password Section */}
            <form
              onSubmit={handleChangePassword}
              className="w-full space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl shadow-sm"
            >
              <div className="flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <KeyRound
                  className="text-blue-600 dark:text-blue-400"
                  size={18}
                />
                <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                  Đổi mật khẩu
                </h2>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 px-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white dark:bg-slate-800 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 px-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white dark:bg-slate-800 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isChangingPassword || !newPassword || !confirmNewPassword
                }
                className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              >
                {isChangingPassword ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </Button>
            </form>

            {/* Quản lý MFA */}
            <div className="w-full space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <Shield
                  className="text-blue-600 dark:text-blue-400"
                  size={18}
                />
                <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                  Bảo mật 2 bước (MFA)
                </h2>
              </div>

              <div className="space-y-4 relative z-10">
                {isLoadingMfa ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : mfaFactors.length > 0 ? (
                  <div className="space-y-3">
                    {mfaFactors.map((factor) => (
                      <div
                        key={factor.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                              {factor.friendly_name || 'Thiết bị xác thực'}
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Đang hoạt động (TOTP)
                            </p>
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors h-8 w-8"
                              disabled={isActionLoading}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                            <AlertDialogHeader>
                              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-3">
                                <AlertTriangle size={24} />
                              </div>
                              <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                Hủy liên kết MFA?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                Hành động này sẽ tắt bảo mật 2 bước cho tài
                                khoản của bạn. Bạn sẽ cần phải đăng ký lại nếu
                                muốn bật lại tính năng này.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                              <AlertDialogCancel className="h-10 px-4 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm">
                                Quay lại
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUnenrollMFA(factor.id)}
                                className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium shadow-md shadow-red-600/10 transition-all border-none text-sm"
                              >
                                {isActionLoading
                                  ? 'Đang xử lý...'
                                  : 'Xác nhận Hủy'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Bạn chưa kích hoạt bảo mật 2 bước.
                    </p>
                    <Link href="/auth/mfa">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold px-6 h-10 shadow-md shadow-blue-600/10 transition-all text-sm">
                        Kích hoạt ngay
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
