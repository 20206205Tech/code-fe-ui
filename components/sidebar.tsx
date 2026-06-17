'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { conversationService } from '@/services/conversation.service';
import { chatbotService, ChatSession } from '@/services/chatbot.service';
import {
  Bookmark,
  CreditCard,
  ExternalLink,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Settings,
  Wrench,
  Sparkles,
  Trash2,
  Volume2,
  User,
  Workflow,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { UserMenu } from './user-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

export function Sidebar() {
  const { user, logout } = useAuth();

  // Kiểm tra role an toàn từ memory
  const isAdmin = user?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get('id');

  useEffect(() => {
    loadHistory();
  }, [activeChatId]); // Refresh history when active chat changes or on mount

  const loadHistory = async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    try {
      const limit = 15;
      const skip = isLoadMore ? sessions.length : 0;
      const history = await chatbotService.getHistory(skip, limit);
      if (isLoadMore) {
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSessions = history.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newSessions];
        });
      } else {
        setSessions(history);
      }
      if (history.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSidebarScroll = () => {
    if (!sidebarScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = sidebarScrollRef.current;
    if (
      scrollHeight - scrollTop - clientHeight < 50 &&
      hasMore &&
      !isLoadingMore &&
      !isLoading
    ) {
      loadHistory(true);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleNewChat = async () => {
    setIsStartingChat(true);
    try {
      const session = await conversationService.startChat();
      setIsOpen(false);
      router.push(`/chat?id=${session.chatId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Không thể tạo cuộc trò chuyện mới.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await conversationService.deleteChat(deleteTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (activeChatId === deleteTarget.id) {
        router.push('/chat');
      }
      toast.success('Đã xóa cuộc trò chuyện');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Không thể xóa cuộc trò chuyện');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
            20206205Tech
          </h1>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Button
            onClick={handleNewChat}
            disabled={isStartingChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isStartingChat ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Cuộc trò chuyện mới
          </Button>
        </div>

        {/* Chat History */}
        <div
          ref={sidebarScrollRef}
          onScroll={handleSidebarScroll}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {/* Chat History */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1">
              Lịch sử trò chuyện
            </h2>
            <div className="space-y-2">
              {isLoading && sessions.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              ) : sessions.length > 0 ? (
                <>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group relative flex items-center rounded-lg transition-all ${
                        activeChatId === session.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/chat?id=${session.id}`);
                        }}
                        className={`flex-1 text-left p-3 text-sm ${
                          activeChatId === session.id
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="truncate pr-6">
                          {session.title || 'Cuộc trò chuyện mới'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(session.updated_at).toLocaleDateString(
                            'vi-VN'
                          )}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(session);
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
                        title="Xóa cuộc trò chuyện"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {isLoadingMore && (
                    <div className="flex justify-center py-2">
                      <Loader2
                        size={16}
                        className="animate-spin text-slate-400"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 py-4 px-1">
                  Không có lịch sử trò chuyện
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

          {user && (
            <div className="mt-2">
              <UserMenu />
            </div>
          )}

          {isAdmin && (
            <>
              <Link href="/admin/plans" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CreditCard size={18} className="mr-2" />
                  Quản lý gói cước
                </Button>
              </Link>
              <Link href="/admin/personas" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User size={18} className="mr-2" />
                  Quản lý nhân vật
                </Button>
              </Link>

              <Link href="/admin/engines" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Wrench size={18} className="mr-2" />
                  Quản lý nền tảng TTS
                </Button>
              </Link>

              <Link href="/admin/voices" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Volume2 size={18} className="mr-2" />
                  Quản lý giọng nói TTS
                </Button>
              </Link>

              <Link
                href="/admin/data-pipeline"
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Workflow size={18} className="mr-2" />
                  Luồng dữ liệu
                </Button>
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Cuộc trò chuyện &quot;
              {deleteTarget?.title || 'Cuộc trò chuyện mới'}&quot; sẽ bị xóa
              vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
