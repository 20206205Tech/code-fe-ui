'use client';

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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { chatShareService } from '@/services/chat-share.service';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Share2,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SharedChat {
  shareId: string;
  chatId: string;
  shareUrl: string;
  isActive: boolean;
  createdAt: string;
}

export default function SharesManager() {
  const { toast } = useToast();
  const [shares, setShares] = useState<SharedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SharedChat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const data = await chatShareService.getMySharedChats(0, 100);
      setShares(data.data || []);
    } catch (error) {
      console.error('Failed to load shares:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách chia sẻ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (share: SharedChat) => {
    const fullUrl = `${window.location.origin}${share.shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(share.shareId);
    toast({
      title: 'Đã copy!',
      description: 'Link chia sẻ đã được copy vào clipboard.',
      variant: 'success',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeShare = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await chatShareService.revokeShare(deleteTarget.shareId);
      toast({
        title: 'Thành công',
        description: 'Đã thu hồi link chia sẻ',
        variant: 'success',
      });
      setShares((prev) =>
        prev.filter((s) => s.shareId !== deleteTarget.shareId)
      );
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thu hồi link',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Share2 className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Chưa có chia sẻ nào
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
          Khi bạn chia sẻ một cuộc trò chuyện, nó sẽ xuất hiện ở đây. Bạn có thể
          quản lý và thu hồi các link chia sẻ bất cứ lúc nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Quản lý chia sẻ
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {shares.length} link chia sẻ đang hoạt động
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {shares.map((share) => (
          <div
            key={share.shareId}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      Cuộc trò chuyện #{share.chatId.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 mb-2">
                  <code className="text-xs text-slate-600 dark:text-slate-400 break-all">
                    {window.location.origin}
                    {share.shareUrl}
                  </code>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Được tạo lúc {formatDate(share.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(share)}
                  className="gap-2"
                >
                  {copiedId === share.shareId ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Đã copy
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(share.shareUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Xem
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(share)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Thu hồi
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Thu hồi link chia sẻ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Link chia sẻ sẽ ngừng hoạt động ngay lập tức. Người dùng sẽ không
              thể truy cập vào cuộc trò chuyện này nữa. Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeShare}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Thu hồi'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
