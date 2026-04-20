'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { chatBookmarkService } from '@/services/chat-bookmark.service';
import { chatService, ChatSession } from '@/services/chat.service';
import {
  Bookmark,
  CreditCard,
  ExternalLink,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Sparkles,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const { user, logout } = useAuth();

  // Kiểm tra role an toàn từ memory
  const isAdmin = user?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [bookmarkFolders, setBookmarkFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarksLoading, setIsBookmarksLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get('id');

  useEffect(() => {
    loadHistory();
    loadBookmarks();
  }, [activeChatId]); // Refresh history when active chat changes or on mount

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await chatService.getHistory();
      setSessions(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    setIsBookmarksLoading(true);
    try {
      const folders = await chatBookmarkService.getBookmarkFolders();
      // For each folder, fetch detail to get items
      const foldersWithItems = await Promise.all(
        folders.map(async (f) => {
          const detail = await chatBookmarkService.getBookmarkDetail(f.id);
          return { ...f, items: detail.items || [] };
        })
      );
      setBookmarkFolders(foldersWithItems);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsBookmarksLoading(false);
    }
  };

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
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Chat History */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1">
              Chat History
            </h2>
            <div className="space-y-2">
              {isLoading && sessions.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              ) : sessions.length > 0 ? (
                sessions.slice(0, 5).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/chat?id=${session.id}`);
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                      activeChatId === session.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="truncate">
                      {session.title || 'Cuộc trò chuyện mới'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {new Date(session.updated_at).toLocaleDateString('vi-VN')}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 py-4 px-1">
                  No history
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Link href="/bookmarks" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bookmark size={18} className="mr-2 text-blue-500" />
              Sổ ghi chú
            </Button>
          </Link>

          <Link href="/shares" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ExternalLink size={18} className="mr-2 text-purple-500" />
              Chia sẻ
            </Button>
          </Link>

          {user && (
            <Link href="/plans" onClick={() => setIsOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Sparkles size={18} className="mr-2 text-yellow-500" />
                Gói cước
              </Button>
            </Link>
          )}

          {/* {user && (
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
          )} */}

          {isAdmin && (
            <>
              <Link
                href="/admin/data-pipeline"
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Workflow size={18} className="mr-2" />
                  Data Pipeline
                </Button>
              </Link>
              <Link href="/admin/plans" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CreditCard size={18} className="mr-2" />
                  Quản lý gói cước
                </Button>
              </Link>
            </>
          )}

          {/* <Link href="/profile" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <User size={18} className="mr-2" />
              Profile
            </Button>
          </Link> */}

          {/* <Link href="/settings" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings size={18} className="mr-2" />
              Settings
            </Button>
          </Link> */}

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
