'use client';

import { useAuth } from '@/lib/auth-context';
import { UserMenu } from './user-menu';

interface UserMenuHeaderProps {
  children?: React.ReactNode;
}

export function UserMenuHeader({ children }: UserMenuHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30">
      <div className="flex-1 flex items-center justify-start">
        {/* Placeholder for potential breadcrumbs or page title */}
      </div>

      <div className="flex items-center gap-2">
        {children}
        {/* User Menu Dropdown */}
        {user && <UserMenu />}
      </div>
    </header>
  );
}
