'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogOut, Menu, Plus, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Menu size={20} className="text-slate-700 dark:text-slate-300" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Chat
          </h1>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Button
            onClick={() => {
              setIsOpen(false);
              router.push('/chat');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">
            Chat History
          </h2>
          <div className="space-y-2">
            {/* Placeholder for chat history */}
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No chat history yet
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 mb-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <Link href="/profile" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <User size={18} className="mr-2" />
              Profile
            </Button>
          </Link>

          <Link href="/settings" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings size={18} className="mr-2" />
              Settings
            </Button>
          </Link>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
