'use client';

import { Sidebar } from '@/components/sidebar';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';
import { authMfaService } from '@/services/auth-mfa.service';
import {
  AlertTriangle,
  ArrowLeft,
  AudioLines,
  Brain,
  Loader2,
  MessageSquare,
  Moon,
  Shield,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSettings } from '../../lib/settings-context';

export default function SettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { tokens } = useAuth();

  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
    if (tokens?.access_token) {
      loadMfaStatus();
    }
  }, [tokens, loadMfaStatus]);

  if (!mounted) return null;

  const handleThemeChange = (newTheme: string) => {
    updateSettings({ theme: newTheme });
    setTheme(newTheme);
  };

  const handleToggleExampleQuestions = (checked: boolean) => {
    updateSettings({ showExampleQuestions: checked });
  };

  const handleToggleAutoExpandReasoning = (checked: boolean) => {
    updateSettings({ autoExpandReasoning: checked });
  };

  const handleToggleVoiceSuggestions = (checked: boolean) => {
    updateSettings({ showVoiceSuggestions: checked });
  };

  const handleUnenrollMFA = async (factorId: string) => {
    if (!tokens?.access_token) return;
    setIsActionLoading(true);
    try {
      await authMfaService.unenrollFactor(factorId, tokens.access_token);
      toast.success('Đã hủy liên kết thiết bị xác thực');
      await loadMfaStatus();
    } catch (error: any) {
      toast.error(
        'Không thể hủy liên kết: ' + (error.message || 'Lỗi không xác định')
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <Suspense
        fallback={
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
        }
      >
        <Sidebar />
      </Suspense>

      <div className="flex-1 flex flex-col md:ml-0">
        <main className="flex-1 overflow-y-auto pt-8 pb-8">
          <div className="max-w-2xl mx-auto p-4 md:p-8">
            {/* Nút quay lại */}
            <Link href="/chat">
              <Button
                variant="ghost"
                className="mb-6 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft size={18} className="mr-2" />
                Quay lại Chat
              </Button>
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Cài đặt
            </h1>

            {/* Mục Appearance */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Giao diện
              </h2>

              <div className="space-y-4">
                {/* Lựa chọn Light Theme */}
                <ThemeOption
                  label="Sáng"
                  description="Giao diện nền sáng với văn bản tối"
                  icon={<Sun size={24} />}
                  isActive={theme === 'light'}
                  onClick={() => handleThemeChange('light')}
                />

                {/* Lựa chọn Dark Theme */}
                <ThemeOption
                  label="Tối"
                  description="Giao diện nền tối với văn bản sáng"
                  icon={<Moon size={24} />}
                  isActive={theme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                />

                {/* Lựa chọn System Theme */}
                <ThemeOption
                  label="Hệ thống"
                  description="Sử dụng cài đặt của thiết bị"
                  icon={
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <Sun
                        size={20}
                        className="absolute transition-opacity"
                        style={{ opacity: isDark ? 0 : 1 }}
                      />
                      <Moon
                        size={20}
                        className="absolute transition-opacity"
                        style={{ opacity: isDark ? 1 : 0 }}
                      />
                    </div>
                  }
                  isActive={theme === 'system'}
                  onClick={() => handleThemeChange('system')}
                />
              </div>
            </div>

            {/* Cài đặt câu hỏi ví dụ */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Câu hỏi ví dụ
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Hiển thị 3 câu hỏi mẫu khi bắt đầu cuộc trò chuyện mới
                    </p>
                  </div>
                </div>
                <Switch
                  id="example-questions-toggle"
                  checked={settings.showExampleQuestions}
                  onCheckedChange={handleToggleExampleQuestions}
                />
              </div>
            </div>

            {/* Tự động mở chi tiết suy luận */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Tự động mở chi tiết suy luận
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Tự động hiển thị các bước suy luận RAG trong cuộc hội
                      thoại
                    </p>
                  </div>
                </div>
                <Switch
                  id="auto-expand-reasoning-toggle"
                  checked={settings.autoExpandReasoning}
                  onCheckedChange={handleToggleAutoExpandReasoning}
                />
              </div>
            </div>

            {/* Gợi ý câu hỏi voice */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full">
                    <AudioLines size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Gợi ý câu hỏi Voice
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Hiển thị các câu hỏi gợi ý khi đang trong phiên hội thoại
                      thoại
                    </p>
                  </div>
                </div>
                <Switch
                  id="voice-suggestions-toggle"
                  checked={settings.showVoiceSuggestions}
                  onCheckedChange={handleToggleVoiceSuggestions}
                />
              </div>
            </div>

            {/* Quản lý MFA */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 mb-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <Shield size={120} />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Shield size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Bảo mật 2 bước (MFA)
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Bảo vệ tài khoản của bạn bằng mã xác thực OTP
                  </p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {isLoadingMfa ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : mfaFactors.length > 0 ? (
                  <div className="space-y-4">
                    {mfaFactors.map((factor) => (
                      <div
                        key={factor.id}
                        className="flex items-center justify-between p-5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 group transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Smartphone size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {factor.friendly_name || 'Thiết bị xác thực'}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              Đang hoạt động (TOTP)
                            </p>
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                              disabled={isActionLoading}
                            >
                              <Trash2 size={18} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                            <AlertDialogHeader>
                              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                              </div>
                              <AlertDialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                                Hủy liên kết MFA?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                Hành động này sẽ tắt bảo mật 2 bước cho tài
                                khoản của bạn. Bạn sẽ cần phải đăng ký lại nếu
                                muốn bật lại tính năng này.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-8 gap-3">
                              <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                Quay lại
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUnenrollMFA(factor.id)}
                                className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 transition-all border-none"
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
                  <div className="text-center py-10 bg-white dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                      Bạn chưa kích hoạt bảo mật 2 bước.
                    </p>
                    <Link href="/auth/mfa">
                      <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold px-8 h-12 shadow-lg shadow-indigo-600/20 transition-all">
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

// Sub-component để code sạch hơn và dễ quản lý UI
function ThemeOption({ label, description, icon, isActive, onClick }: any) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isActive
          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={
            isActive ? 'text-blue-600' : 'text-slate-400 dark:text-slate-600'
          }
        >
          {icon}
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
      {isActive && <div className="w-3 h-3 rounded-full bg-blue-600" />}
    </div>
  );
}
