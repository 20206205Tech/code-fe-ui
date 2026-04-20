'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderOpen,
  MessageSquare,
  Trash2,
  Loader2,
  ChevronRight,
  ExternalLink,
  Search,
  BookMarked,
} from 'lucide-react';
import { chatBookmarkService } from '@/services/chat-bookmark.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BookmarkItem {
  id: string;
  chatId: string;
  title: string;
  note: string;
  created_at: string;
}

interface BookmarkFolder {
  id: string;
  folderName: string;
  items: BookmarkItem[];
}

export default function BookmarksManager() {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BookmarkItem | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const folderList = await chatBookmarkService.getBookmarkFolders();

      const detailedFolders = await Promise.all(
        folderList.map(async (f: any) => {
          const detail = await chatBookmarkService.getBookmarkDetail(f.id);
          return {
            id: f.id,
            folderName: f.folderName,
            items: detail.items || [],
          };
        })
      );

      setFolders(detailedFolders);

      // Auto-select first item if available
      if (detailedFolders.length > 0 && detailedFolders[0].items.length > 0) {
        setSelectedItem(detailedFolders[0].items[0]);
        setSelectedFolderId(detailedFolders[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      toast.error('Không thể tải danh sách bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (folderId: string, chatId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bookmark này?')) return;

    try {
      await chatBookmarkService.removeBookmarkItem(folderId, chatId);
      toast.success('Đã xóa bookmark');

      if (selectedItem?.chatId === chatId) {
        setSelectedItem(null);
      }

      fetchBookmarks();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Không thể xóa bookmark');
    }
  };

  const filteredFolders = folders
    .map((f) => ({
      ...f,
      items: f.items.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.note?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((f) => f.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex overflow-hidden">
      {/* Master List (Topic Chats) */}
      <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder="Tìm kiếm bookmark..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredFolders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <BookMarked size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Không tìm thấy bookmark nào</p>
            </div>
          ) : (
            filteredFolders.map((folder, folderIdx) => (
              <div key={folder.id || `folder-${folderIdx}`}>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <FolderOpen size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {folder.folderName}
                  </span>
                </div>
                {folder.items.map((item, itemIdx) => (
                  <button
                    key={
                      item.id || `item-${folder.id}-${item.chatId || itemIdx}`
                    }
                    onClick={() => {
                      setSelectedItem(item);
                      setSelectedFolderId(folder.id);
                    }}
                    className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors flex items-center gap-3 ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        selectedItem?.id === item.id
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          selectedItem?.id === item.id
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title || 'Đã lưu'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.note || 'Không có ghi chú'}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 flex-shrink-0"
                    />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail View (Notes) */}
      <div className="flex-1 bg-slate-50/30 dark:bg-slate-900/10 overflow-y-auto">
        {selectedItem ? (
          <div className="p-8 max-w-3xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <Badge className="mb-3">Bookmark Detail</Badge>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {selectedItem.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lưu vào ngày{' '}
                  {new Date(
                    selectedItem.created_at || Date.now()
                  ).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push(`/chat?id=${selectedItem.chatId}`)}
                >
                  <ExternalLink size={14} />
                  Đi đến chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() =>
                    selectedFolderId &&
                    handleDelete(selectedFolderId, selectedItem.chatId)
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2">
                Ghi chú của bạn
              </h3>
              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                {selectedItem.note ? (
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {selectedItem.note}
                  </p>
                ) : (
                  <p className="italic text-slate-400">
                    Bạn chưa thêm ghi chú nào cho bookmark này.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <BookMarked size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Chọn một bookmark để xem chi tiết
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2">
              Bạn có thể xem ghi chú và truy cập lại cuộc trò chuyện từ đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
