'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { UserMenuHeader } from '@/components/user-menu-header';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Moon, Sun, MessageSquare } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSettings } from '../../lib/settings-context';

export default function SettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleThemeChange = (newTheme: string) => {
    updateSettings({ theme: newTheme });
    setTheme(newTheme);
  };

  const handleToggleExampleQuestions = (checked: boolean) => {
    updateSettings({ showExampleQuestions: checked });
  };

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-0">
        <UserMenuHeader />

        <main className="flex-1 overflow-y-auto pt-16 pb-8">
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
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 transition-colors">
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
