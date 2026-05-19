'use client';

import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl transition-all w-full group bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm text-base">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {user.name}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {user.email}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-left-2 duration-200 w-56 left-[calc(100%+0.5rem)] bottom-0">
          <div className="p-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 text-sm"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              Trang cá nhân
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 text-sm"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} />
              Cài đặt
            </Link>
          </div>

          <div className="p-2 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-red-600 dark:text-red-400 text-sm"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
