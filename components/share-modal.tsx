'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { chatShareService } from '@/services/chat-share.service';
import { AlertCircle, Check, Copy, Loader2, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | null;
}

type ShareStatus = 'idle' | 'creating' | 'ready' | 'error';

export function ShareModal({ isOpen, onClose, chatId }: ShareModalProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset state khi modal đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setShareUrl('');
      setCopied(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Auto-generate share link khi modal mở
  useEffect(() => {
    if (isOpen && chatId && status === 'idle') {
      handleGenerateShare();
    }
  }, [isOpen, chatId]);

  const handleGenerateShare = async () => {
    if (!chatId) return;

    setStatus('creating');
    setErrorMessage('');

    try {
      const data = await chatShareService.generateShareLink(chatId);
      const fullUrl = `${window.location.origin}${data.shareUrl}`;

      setShareUrl(fullUrl);
      setStatus('ready');

      toast({
        title: 'Link chia sẻ đã sẵn sàng!',
        description: 'Bạn có thể copy và chia sẻ link này.',
        variant: 'success',
      });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Không thể tạo link chia sẻ'
      );
      toast({
        title: 'Lỗi',
        description: errorMessage || 'Không thể tạo link chia sẻ',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: 'Đã copy!',
      description: 'Link chia sẻ đã được copy vào clipboard.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (status) {
      case 'creating':
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Đang tạo link chia sẻ...
            </p>
          </div>
        );

      case 'ready':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Link chia sẻ đã sẵn sàng!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Bạn có thể chia sẻ link này với bất kỳ ai. Họ sẽ xem được nội
                  dung cuộc trò chuyện mà không cần đăng nhập.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Link chia sẻ
              </label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-xs bg-slate-50 dark:bg-slate-900"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                ℹ️ Lưu ý quan trọng:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4">
                <li>
                  • Link này cho phép xem nội dung cuộc trò chuyện công khai
                </li>
                <li>
                  • Bạn có thể thu hồi link bất cứ lúc nào từ trang Quản lý chia
                  sẻ
                </li>
                <li>• Không chia sẻ link chứa thông tin nhạy cảm</li>
              </ul>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Có lỗi xảy ra
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {errorMessage}
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerateShare}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Chia sẻ cuộc trò chuyện
          </DialogTitle>
          <DialogDescription>
            Tạo link công khai để chia sẻ cuộc trò chuyện này
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
