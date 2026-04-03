'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenuHeader } from '@/components/user-menu-header';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <UserMenuHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8 flex flex-col items-center">
            {/* Nút quay lại & Tiêu đề */}
            <div className="w-full flex items-center justify-between">
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Profile</h1>
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
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
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
                {isLoading ? 'Processing...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
