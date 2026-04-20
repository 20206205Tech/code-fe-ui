'use client';

import { BookmarkModal } from '@/components/bookmark-modal';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { ShareModal } from '@/components/share-modal';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuHeader } from '@/components/user-menu-header';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { chatService } from '@/services/chat.service';
import { Bookmark, Loader2, MessageSquare, Share2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  status?: string;
  sources?: any[];
}

const EXAMPLE_QUESTIONS = [
  'Xin chào. Bạn có khỏe không?',
  // 'Tóm tắt nội dung của văn bản 009/SLT.',
  'Về quê họ hàng chơi có phải đăng ký tạm trú không?',
  'Quy định về xin giấy phép lao động cho người nước ngoài?',
];

function ChatContent() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    searchParams.get('id')
  );
  const activeChatIdRef = useRef<string | null>(searchParams.get('id'));
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat detail if ID is present
  useEffect(() => {
    const chatId = searchParams.get('id');
    if (chatId) {
      // Load if ID changed OR if we have no messages (initial mount)
      if (chatId !== activeChatIdRef.current || messages.length === 0) {
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);
        loadChatDetail(chatId);
      }
    } else {
      activeChatIdRef.current = null;
      setActiveChatId(null);
      setMessages([]);
    }
  }, [searchParams]);

  const loadChatDetail = async (chatId: string) => {
    setIsLoading(true);
    try {
      const history = await chatService.getChatMessages(chatId);
      const mappedMessages: Message[] = history.map((m) => ({
        role: m.role === 'human' ? 'user' : 'assistant',
        content: m.content,
      }));
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Failed to load chat detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string, docIds?: string[]) => {
    if (!message.trim() || isLoading) return;

    let chatId = activeChatId;

    // Add user message to UI
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentStatus('Đang khởi tạo...');

    try {
      // 1. Start chat if not exists
      if (!chatId) {
        const session = await chatService.startChat();
        chatId = session.chatId;
        activeChatIdRef.current = chatId;
        setActiveChatId(chatId);
        // Update URL without refreshing
        window.history.pushState({}, '', `/chat?id=${chatId}`);
      }

      // 2. Prepare assistant message placeholder
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // 3. Stream chat
      await chatService.streamChat(chatId, message, docIds || [], (update) => {
        if (update.type === 'status') {
          setCurrentStatus(update.message);
        } else if (update.type === 'content') {
          // Keep status visible during streaming unless metadata arrives
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const newMessages = [...prev];
            const lastIdx = newMessages.length - 1;
            const lastMsg = newMessages[lastIdx];
            if (lastMsg && lastMsg.role === 'assistant') {
              newMessages[lastIdx] = {
                ...lastMsg,
                content: (lastMsg.content || '') + update.message,
              };
            }
            return newMessages;
          });
        } else if (update.type === 'metadata') {
          setCurrentStatus(null);
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const newMessages = [...prev];
            const lastIdx = newMessages.length - 1;
            const lastMsg = newMessages[lastIdx];
            if (lastMsg && lastMsg.role === 'assistant') {
              newMessages[lastIdx] = {
                ...lastMsg,
                isStreaming: false,
                sources: update.message.sources,
                content: update.message.full_answer || lastMsg.content,
              };
            }
            return newMessages;
          });
        }
      });

      // Fallback: Ensure the last message is no longer in "streaming" state
      // This handles cases where the metadata packet might be missing
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        const lastMsg = newMessages[lastIdx];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
          newMessages[lastIdx] = {
            ...lastMsg,
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại.',
          isStreaming: false,
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentStatus(null);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-0">
        {/* Header with Actions */}
        <UserMenuHeader>
          {activeChatId && messages.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsBookmarkModalOpen(true)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-9 w-9"
                    >
                      <Bookmark size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Lưu vào Bookmark</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsShareModalOpen(true)}
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-9 w-9"
                    >
                      <Share2 size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chia sẻ</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            </div>
          )}
        </UserMenuHeader>

        {/* Messages Container */}
        <main className="flex-1 overflow-y-auto pt-16 pb-24">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Chào mừng bạn đến với Chat
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                  Bắt đầu cuộc trò chuyện bằng cách gửi một tin nhắn. Tôi luôn
                  sẵn sàng giúp đỡ!
                </p>

                {settings.showExampleQuestions && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
                    {EXAMPLE_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(question)}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <MessageSquare size={16} />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {question}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-6">
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    {/* Move Status/Reasoning above the message bubble if it's the streaming assistant message */}
                    {idx === messages.length - 1 &&
                      msg.role === 'assistant' &&
                      msg.isStreaming &&
                      currentStatus && (
                        <div className="flex items-center gap-2 px-14 py-2 text-xs text-blue-600 dark:text-blue-400 font-medium italic animate-pulse">
                          <Loader2 size={12} className="animate-spin" />
                          {currentStatus}
                        </div>
                      )}
                    <ChatMessage
                      role={msg.role}
                      content={msg.content}
                      avatar={msg.role === 'user' ? user?.avatar : undefined}
                      userName={user?.name || 'User'}
                      sources={msg.sources}
                    />
                  </div>
                ))}
                {isLoading &&
                  messages.length > 0 &&
                  !messages[messages.length - 1].isStreaming && (
                    <div className="flex gap-4 py-6">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          />
                          <div
                            className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          />
                        </div>
                        {currentStatus && (
                          <p className="text-xs text-slate-500 animate-pulse italic">
                            {currentStatus}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
              Trợ lý AI hỗ trợ thông tin chỉ mang tính chất tham khảo và có thể
              mắc sai sót.
            </p>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        chatId={activeChatId}
      />

      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        chatId={activeChatId}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
