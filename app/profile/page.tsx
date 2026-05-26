'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/services/auth.service';
import { ArrowLeft, Upload, KeyRound, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, Suspense } from 'react';

export default function ProfilePage() {
  const { user, updateUser, tokens } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  // States for change password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleUpdate = async (data: { name?: string; avatarFile?: File }) => {
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
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                    alt="avatar"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
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
                handleUpdate({ name });
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
                disabled={isLoading || name === user?.name || !name.trim()}
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
          </div>
        </main>
      </div>
    </div>
  );
}
