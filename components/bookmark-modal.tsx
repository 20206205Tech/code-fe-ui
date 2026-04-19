'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, FolderPlus, Loader2, Plus, Check } from 'lucide-react';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | null;
}

export function BookmarkModal({ isOpen, onClose, chatId }: BookmarkModalProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const data = await chatService.getBookmarkFolders();
      setFolders(data);
      if (data.length > 0 && !selectedFolderId) {
        setSelectedFolderId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsLoading(true);
    try {
      await chatService.createBookmarkFolder(newFolderName);
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadFolders();
      toast.success('Đã tạo thư mục mới!');
    } catch (error) {
      toast.error('Không thể tạo thư mục.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!chatId || !selectedFolderId) return;
    setIsSaving(true);
    try {
      await chatService.addBookmarkItem(selectedFolderId, chatId, note);
      toast.success('Đã lưu vào Bookmark!');
      onClose();
    } catch (error) {
      toast.error('Lỗi khi lưu Bookmark.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Bookmark size={20} fill="currentColor" />
            Lưu vào Bookmark
          </DialogTitle>
          <DialogDescription>
            Tổ chức các cuộc trò chuyện quan trọng vào thư mục để dễ dàng tra
            cứu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Folder Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase text-slate-500">
                Thư mục
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-blue-600 px-2"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              >
                {isCreatingFolder ? (
                  'Hủy'
                ) : (
                  <>
                    <Plus size={12} className="mr-1" />
                    Thư mục mới
                  </>
                )}
              </Button>
            </div>

            {isCreatingFolder ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                <Input
                  placeholder="Tên thư mục..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
                <Button
                  onClick={handleCreateFolder}
                  size="sm"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Tạo
                </Button>
              </div>
            ) : folders.length > 0 ? (
              <ScrollArea className="h-[120px] rounded-md border border-slate-200 dark:border-slate-800 p-1">
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
                        selectedFolderId === folder.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{folder.folderName}</span>
                      {selectedFolderId === folder.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500">Chưa có thư mục nào.</p>
              </div>
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-2">
            <Label
              htmlFor="note"
              className="text-xs font-semibold uppercase text-slate-500"
            >
              Ghi chú (Tùy chọn)
            </Label>
            <Input
              id="note"
              placeholder="Nhập ghi chú nhỏ để gợi nhớ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !chatId || !selectedFolderId}
            className="bg-blue-600 hover:bg-blue-700 w-24"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Lưu lại'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
