'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { UserMenuHeader } from '@/components/user-menu-header';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
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
                Back to Chat
              </Button>
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Settings
            </h1>

            {/* Mục Appearance */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Appearance
              </h2>

              <div className="space-y-4">
                {/* Lựa chọn Light Theme */}
                <ThemeOption
                  label="Light"
                  description="Light background with dark text"
                  icon={<Sun size={24} />}
                  isActive={theme === 'light'}
                  onClick={() => handleThemeChange('light')}
                />

                {/* Lựa chọn Dark Theme */}
                <ThemeOption
                  label="Dark"
                  description="Dark background with light text"
                  icon={<Moon size={24} />}
                  isActive={theme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                />

                {/* Lựa chọn System Theme */}
                <ThemeOption
                  label="System"
                  description="Use device settings"
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

            {/* Ví dụ về việc mở rộng: Ngôn ngữ (Sẽ dùng được ngay vì đã có updateSettings) */}
            {/* <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
               <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Language</h2>
               <select 
                value={settings.language} 
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
               >
                 <option value="en">English</option>
                 <option value="vi">Tiếng Việt</option>
               </select>
            </div> */}
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
