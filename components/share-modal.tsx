'use client';

import { useState } from 'react';
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
import { Check, Copy, Share2, Loader2 } from 'lucide-react';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | null;
}

export function ShareModal({ isOpen, onClose, chatId }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareData, setShareData] = useState<{
    shareId: string;
    token: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!chatId) return;
    setIsGenerating(true);
    try {
      const data = await chatService.generateShareLink(chatId);
      setShareData(data);
    } catch (error) {
      toast.error('Không thể tạo liên kết chia sẻ.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareUrl = shareData
    ? `${window.location.origin}/share/${shareData.shareId}/${shareData.token}`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Đã sao chép liên kết!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Share2 size={20} />
            Chia sẻ cuộc trò chuyện
          </DialogTitle>
          <DialogDescription>
            Bất kỳ ai có liên kết này đều có thể xem lịch sử cuộc trò chuyện mà
            không cần đăng nhập.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!shareData ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-sm text-slate-500 text-center">
                Tạo một liên kết công khai để chia sẻ kiến thức này với đồng
                nghiệp hoặc bạn bè.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !chatId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo liên kết chia sẻ'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 h-9 w-9 shrink-0"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Lưu ý: Chỉ những tin nhắn hiện tại sẽ được chia sẻ. Các tin nhắn
                mới sau này sẽ không tự động cập nhật vào liên kết này (tùy
                thuộc vào cấu hình hệ thống).
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
