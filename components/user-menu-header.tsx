'use client';

import { useAuth } from '@/lib/auth-context';
import { UserMenu } from './user-menu';

export function UserMenuHeader() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end px-6 z-30">
      {/* User Menu Dropdown */}
      {user && <UserMenu />}
    </header>
  );
}
