'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatMessage } from '@/components/chat-message';
import { chatShareService } from '@/services/chat-share.service';
import { Loader2, AlertCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PublicSharePage() {
  const { shareId, token } = useParams() as { shareId: string; token: string };
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const response = await chatShareService.getPublicShareDetail(
          shareId,
          token
        );
        // The API returns { message: string, data: { data: messages[], shareId, chatId, totalMessages } }
        if (response.data && Array.isArray(response.data.data)) {
          setMessages(response.data.data);
        } else if (response.data && Array.isArray(response.data.messages)) {
          setMessages(response.data.messages);
        } else if (Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (err) {
        setError('Liên kết này không tồn tại hoặc đã hết hạn.');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareId && token) {
      loadDetail();
    }
  }, [shareId, token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-slate-500 font-medium">
          Đang tải cuộc trò chuyện...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Đã xảy ra lỗi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full">
            <Link href="/chat">Quay lại trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Share2 size={16} />
            </div>
            <h1 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">
              Cuộc trò chuyện được chia sẻ
            </h1>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:flex"
          >
            <Link href="/chat">Tạo chat của riêng bạn</Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 md:px-0">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role === 'human' ? 'user' : 'assistant'}
              content={msg.content}
              sources={msg.sources}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 mb-4">
          Nội dung này được chia sẻ thông qua Trợ lý AI Pháp lý.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/chat">Bắt đầu trò chuyện miễn phí</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
