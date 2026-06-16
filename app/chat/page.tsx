'use client';

import { BookmarkModal } from '@/components/bookmark-modal';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { ShareModal } from '@/components/share-modal';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { cn } from '@/lib/utils';
import { chatbotService } from '@/services/chatbot.service';
import { conversationService } from '@/services/conversation.service';
import { Persona, personaService } from '@/services/persona.service';
import {
  Bookmark,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Share2,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  status?: string;
  sources?: any[];
  persona_id?: string | null;
  reasoning_steps?: { content: string; step_order: number }[];
  pending_confirmation?: boolean;
}

const EXAMPLE_QUESTIONS = [
  'Xin chào. Bạn có khỏe không',
  'Tóm tắt nội dung của văn bản 67/2006/QH11',
  'Về quê họ hàng chơi có phải đăng ký tạm trú không',
  // 'Quy định về xin giấy phép lao động cho người nước ngoài',
  // 'Tóm tắt nội dung của văn bản XYZ (demo)',
];

function ChatContent() {
  const {
    user,
    isAuthenticated,
    isMfaRequired,
    isLoading: isAuthLoading,
    syncSubscription,
  } = useAuth();
  const { settings, updateSettings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      if (isMfaRequired) {
        router.push('/auth/mfa');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isMfaRequired, isAuthLoading, router]);

  // Sync subscription status when landing on chat page to ensure VIP status is up-to-date
  // Chỉ gọi khi đã xác thực đầy đủ (aal2) — isAuthenticated đã đảm bảo điều này
  useEffect(() => {
    if (isAuthenticated && !isMfaRequired) {
      syncSubscription();
    }
  }, [isAuthenticated, isMfaRequired]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    searchParams.get('id')
  );
  const activeChatIdRef = useRef<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const preventScrollRef = useRef(false);

  const useReasoning = settings.useReasoning;
  const setUseReasoning = (val: boolean) =>
    updateSettings({ useReasoning: val });
  const { subscription } = useAuth();
  const isVip = subscription?.has_active_subscription === true;

  useEffect(() => {
    console.log(
      '[ChatPage] isVip status changed:',
      isVip,
      'subscription:',
      subscription
    );
  }, [isVip, subscription]);

  // Persona states
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isPersonasLoading, setIsPersonasLoading] = useState(true);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [currentPersonaIdx, setCurrentPersonaIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load chat detail if ID is present
  useEffect(() => {
    const chatId = searchParams.get('id');
    if (chatId) {
      // Chỉ load nếu chatId khác với Ref hiện tại (nghĩa là thực sự chuyển chat)
      // Hoặc nếu chưa có tin nhắn nào (lần đầu vào trang)
      if (chatId !== activeChatIdRef.current) {
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

  // Load personas
  useEffect(() => {
    const fetchPersonas = async () => {
      setIsPersonasLoading(true);
      try {
        const data = await personaService.getPersonas(1, 100);
        const activePersonas = data.items.filter((p) => p.is_active);
        setPersonas(activePersonas);

        if (activePersonas.length > 0) {
          // Priority: 1. Saved settings, 2. First active persona
          const savedId = settings.selectedPersonaId;
          const savedIdx = savedId
            ? activePersonas.findIndex((p) => p.id === savedId)
            : -1;

          if (savedIdx !== -1) {
            setSelectedPersona(activePersonas[savedIdx]);
            setCurrentPersonaIdx(savedIdx);
          } else {
            setSelectedPersona(activePersonas[0]);
            setCurrentPersonaIdx(0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch personas:', error);
      } finally {
        setIsPersonasLoading(false);
      }
    };
    fetchPersonas();
  }, [settings.selectedPersonaId]);

  // Play greeting audio when persona modal is open and persona changes
  useEffect(() => {
    if (isPersonaModalOpen && personas[currentPersonaIdx]?.greeting_audio_url) {
      // Stop previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(personas[currentPersonaIdx].greeting_audio_url);
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.error('Failed to play greeting audio:', err);
      });
    }
  }, [isPersonaModalOpen, currentPersonaIdx, personas]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNextPersona = () => {
    setCurrentPersonaIdx((prev) => (prev + 1) % personas.length);
  };

  const handlePrevPersona = () => {
    setCurrentPersonaIdx(
      (prev) => (prev - 1 + personas.length) % personas.length
    );
  };

  const getPersonaAvatar = (personaId?: string | null) => {
    if (!personaId) return undefined;
    const persona = personas.find((p) => p.id === personaId);
    return persona?.avatar_url;
  };

  const handleSelectPersona = () => {
    const persona = personas[currentPersonaIdx];
    setSelectedPersona(persona);
    setIsPersonaModalOpen(false);
    toast.success(`Đã chọn nhân vật: ${persona.name}`);

    // Persist to settings
    updateSettings({ selectedPersonaId: persona.id });

    // If audio is already playing from the preview, let it continue.
    // If not, play it now.
    if (persona.greeting_audio_url) {
      if (
        !audioRef.current ||
        audioRef.current.src !== persona.greeting_audio_url
      ) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(persona.greeting_audio_url);
        audioRef.current = audio;
        audio
          .play()
          .catch((err) => console.error('Failed to play greeting audio:', err));
      }
    }
  };

  const loadChatDetail = async (chatId: string) => {
    setIsHistoryLoading(true);
    try {
      const limit = 20;
      const history = await chatbotService.getChatMessages(
        chatId,
        undefined,
        limit
      );
      const mappedMessages: Message[] = (history || []).map((m, idx) => {
        const isLastMsg = idx === (history || []).length - 1;
        const hasPendingFlag =
          (m as any).pending_confirmation ||
          (m as any).metadata?.pending_confirmation;

        // Smart fallback: Tự động phục hồi nút nếu tin nhắn AI cuối cùng có nội dung hỏi tiếp tục hoặc chọn (Có/Không)
        const inferPending =
          isLastMsg &&
          m.role !== 'human' &&
          (m.content.includes('(Có/Không)') ||
            m.content.includes('Tiếp tục tra cứu?') ||
            m.content.includes('Tiếp tục?'));

        return {
          id: m.id,
          role: m.role === 'human' ? 'user' : 'assistant',
          content: m.content,
          persona_id: m.persona_id,
          reasoning_steps: m.reasoning_steps,
          sources: m.sources,
          pending_confirmation: !!(hasPendingFlag || inferPending),
        };
      });
      console.log('[ChatPage] Loaded history messages:', mappedMessages);
      setMessages(mappedMessages);
      if (history && history.length === limit) {
        setHasMoreMessages(true);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load chat detail:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (preventScrollRef.current) {
      preventScrollRef.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  const loadOlderMessages = async (prevScrollHeight: number) => {
    if (!activeChatId || isLoadingOlder) return;

    const oldestDbMessage = messages.find((m) => m.id);
    if (!oldestDbMessage?.id) return;

    setIsLoadingOlder(true);
    preventScrollRef.current = true;

    try {
      const limit = 20;
      const history = await chatbotService.getChatMessages(
        activeChatId,
        oldestDbMessage.id,
        limit
      );

      if (history && history.length > 0) {
        const mappedOlder: Message[] = history.map((m) => {
          const hasPendingFlag =
            (m as any).pending_confirmation ||
            (m as any).metadata?.pending_confirmation;
          return {
            id: m.id,
            role: m.role === 'human' ? 'user' : 'assistant',
            content: m.content,
            persona_id: m.persona_id,
            reasoning_steps: m.reasoning_steps,
            sources: m.sources,
            pending_confirmation: !!hasPendingFlag,
          };
        });

        setMessages((prev) => [...mappedOlder, ...prev]);

        if (history.length < limit) {
          setHasMoreMessages(false);
        } else {
          setHasMoreMessages(true);
        }

        requestAnimationFrame(() => {
          if (mainRef.current) {
            const newScrollHeight = mainRef.current.scrollHeight;
            const delta = newScrollHeight - prevScrollHeight;
            mainRef.current.scrollTop = delta;
          }
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
      toast.error('Không thể tải tin nhắn cũ hơn');
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleScroll = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight } = mainRef.current;
    if (
      scrollTop < 50 &&
      hasMoreMessages &&
      !isLoadingOlder &&
      !isHistoryLoading
    ) {
      loadOlderMessages(scrollHeight);
    }
  };

  const isSendingRef = useRef(false);

  const handleChatCreated = useCallback((chatId: string) => {
    activeChatIdRef.current = chatId;
    setActiveChatId(chatId);
    // Update URL without refreshing
    window.history.pushState({}, '', `/chat?id=${chatId}`);
  }, []);

  const [isAgentReasoning, setIsAgentReasoning] = useState(false);

  const handleAgentState = useCallback((isReasoning: boolean) => {
    console.log(`[VoiceSync] Agent reasoning state: ${isReasoning}`);
    setIsAgentReasoning(isReasoning);
    if (!isReasoning) {
      setCurrentStatus(null);
    }
  }, []);

  const handleVoiceMessage = useCallback(
    (
      role: string,
      content: string,
      isFinal: boolean,
      sources?: any[],
      pending_confirmation?: boolean
    ) => {
      if (!content || content.trim() === '') return;

      // LỌC: Nếu Agent đang trong trạng thái suy luận, bỏ qua mọi transcription streaming
      if (role === 'agent' && isAgentReasoning) {
        console.log(
          '[VoiceFilter] Bỏ qua transcription vì Agent đang suy luận:',
          content
        );
        return;
      }

      // Xóa status xoay/reasoning của lượt trước/hiện tại khi bắt đầu có transcription mới
      setCurrentStatus(null);

      const trimmedContent = content.trim();
      const messageRole = role === 'agent' ? 'assistant' : 'user';
      const messagePersonaId = role === 'agent' ? selectedPersona?.id : null;

      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        const lastMsg = lastIdx >= 0 ? prev[lastIdx] : null;

        // Kiểm tra xem tin nhắn nhận được có thuộc về lượt trò chuyện hiện tại không
        const isSameTurn =
          lastMsg &&
          lastMsg.role === messageRole &&
          (lastMsg.isStreaming ||
            lastMsg.content.trim() === trimmedContent ||
            trimmedContent.startsWith(lastMsg.content.trim()) ||
            lastMsg.content.trim().startsWith(trimmedContent) ||
            !!sources ||
            !!pending_confirmation);

        if (isSameTurn) {
          const newMessages = [...prev];
          const lastTrimmed = lastMsg.content.trim();

          let newContent = lastMsg.content;
          if (messageRole === 'assistant') {
            // Kiểm tra xem đây là transcription cuốn (incremental) hay là đoạn mới
            if (
              trimmedContent.startsWith(lastTrimmed) ||
              lastTrimmed.startsWith(trimmedContent)
            ) {
              newContent =
                trimmedContent.length >= lastTrimmed.length
                  ? trimmedContent
                  : lastTrimmed;
            } else {
              // Nếu là đoạn mới hoàn toàn, ta cộng dồn với dấu cách
              newContent = lastMsg.content + ' ' + trimmedContent;
            }
          } else {
            newContent = isFinal ? trimmedContent : trimmedContent;
          }

          newMessages[lastIdx] = {
            ...lastMsg,
            content: newContent,
            isStreaming: !isFinal,
            persona_id: messagePersonaId,
            sources: sources || lastMsg.sources,
            pending_confirmation:
              pending_confirmation !== undefined
                ? pending_confirmation
                : lastMsg.pending_confirmation,
          };
          return newMessages;
        }

        // Nếu khác role hoặc chưa có tin nhắn nào, tạo mới
        return [
          ...prev,
          {
            role: messageRole,
            content: trimmedContent,
            isStreaming: !isFinal,
            persona_id: messagePersonaId,
            reasoning_steps: [],
            sources: sources,
            pending_confirmation: pending_confirmation || false,
          },
        ];
      });
    },
    [selectedPersona, isAgentReasoning]
  );

  const handleVoiceStatus = useCallback(
    (status: string, hidden?: boolean) => {
      if (!status) return;
      const trimmedStatus = status.trim();

      // Chỉ hiện spinner nếu không bị ẩn
      if (!hidden) setCurrentStatus(trimmedStatus);

      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        const lastMsg = lastIdx >= 0 ? prev[lastIdx] : null;

        // Nếu message cuối không phải assistant, tạo mới để chứa status
        if (!lastMsg || lastMsg.role !== 'assistant') {
          return [
            ...prev,
            {
              role: 'assistant',
              content: '',
              reasoning_steps: [
                {
                  content: trimmedStatus,
                  step_order: 1,
                  hidden: !!hidden,
                },
              ],
              isStreaming: true,
            },
          ];
        }

        // Nếu đã là assistant, thêm vào reasoning_steps hiện có
        const currentSteps = lastMsg.reasoning_steps || [];

        if (!currentSteps.some((s) => s.content.trim() === trimmedStatus)) {
          const newSteps = [
            ...currentSteps,
            {
              content: trimmedStatus,
              step_order: currentSteps.length + 1,
              hidden: !!hidden,
            },
          ];
          const newMessages = [...prev];
          newMessages[lastIdx] = {
            ...lastMsg,
            reasoning_steps: newSteps,
          };
          return newMessages;
        }

        return prev;
      });
    },
    [setMessages]
  );

  const handleSendMessage = async (message: string, docIds?: string[]) => {
    if (
      !message.trim() ||
      isMessageSending ||
      isHistoryLoading ||
      isPersonasLoading ||
      isSendingRef.current
    )
      return;

    isSendingRef.current = true;

    let chatId = activeChatId;

    // Add user message to UI
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsMessageSending(true);
    setCurrentStatus('Đang khởi tạo...');

    try {
      // 1. Start chat if not exists
      if (!chatId) {
        const session = await conversationService.startChat();
        chatId = session.chatId;
        handleChatCreated(chatId);
      }

      // 2. Prepare assistant message placeholder
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        isStreaming: true,
        persona_id: null,
        reasoning_steps: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // 3. Stream chat
      await conversationService.streamChat(
        chatId,
        message,
        docIds || [],
        useReasoning,
        (update) => {
          if (update.type === 'status' || update.type === 'status_update') {
            console.log('[Status Update]:', update.message);
            // Show as live status (giống như lúc chat)
            setCurrentStatus(update.message);
            // Lưu lại các bước xử lý vào message
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const newMessages = [...prev];
              const lastIdx = newMessages.length - 1;
              const lastMsg = newMessages[lastIdx];
              if (lastMsg && lastMsg.role === 'assistant') {
                const currentSteps = lastMsg.reasoning_steps || [];
                if (!currentSteps.some((s) => s.content === update.message)) {
                  newMessages[lastIdx] = {
                    ...lastMsg,
                    reasoning_steps: [
                      ...currentSteps,
                      {
                        content: update.message,
                        step_order: currentSteps.length + 1,
                      },
                    ],
                  };
                }
              }
              return newMessages;
            });
          } else if (
            update.type === 'content' ||
            update.type === 'content_chunk'
          ) {
            // Tắt trạng thái xoay (status) ngay khi bắt đầu nhận nội dung văn bản
            setCurrentStatus(null);
            const chunk =
              typeof update.message === 'string'
                ? update.message
                : update.message?.content || update.content || '';

            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const newMessages = [...prev];
              const lastIdx = newMessages.length - 1;
              const lastMsg = newMessages[lastIdx];
              if (lastMsg && lastMsg.role === 'assistant') {
                newMessages[lastIdx] = {
                  ...lastMsg,
                  content: (lastMsg.content || '') + chunk,
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
                  sources: update.message?.sources || update.sources,
                  content:
                    update.message?.full_answer ||
                    update.full_answer ||
                    lastMsg.content,
                  pending_confirmation:
                    update.message?.pending_confirmation ||
                    update.pending_confirmation ||
                    false,
                };
              }
              return newMessages;
            });
          }
        }
      );

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
    } catch (error: any) {
      console.error('Error sending message:', error);

      const status = error?.status;
      const message =
        error?.message || 'Đã xảy ra lỗi khi kết nối với máy chủ.';

      // Dọn placeholder streaming trước
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.isStreaming && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });

      // Toast cho lỗi business rule (403, 401, hoặc message từ server không phải JSON)
      if (status === 403 || status === 401) {
        toast.error(message);
      } else if (
        message.includes('VIP') ||
        message.includes('nâng cấp') ||
        message.includes('Tính năng')
      ) {
        // Text lỗi thô từ NestJS SSE (ForbiddenException không serialize thành JSON)
        toast.error(message);
      } else {
        // Lỗi hệ thống → hiển thị trong bubble chat
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant' as const,
            content: `⚠️ ${message}`,
            isStreaming: false,
          },
        ]);
      }
    } finally {
      setIsMessageSending(false);
      setCurrentStatus(null);
      isSendingRef.current = false;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-0">
        {/* Header with Actions */}
        <ChatHeader
          leftContent={
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isPersonasLoading || isHistoryLoading}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold transition-all min-w-[120px]',
                      (isPersonasLoading || isHistoryLoading) &&
                        'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isPersonasLoading || isHistoryLoading ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin text-slate-400"
                        />
                        <span className="text-slate-400">Đang tải...</span>
                      </>
                    ) : !useReasoning ? (
                      <>
                        <Zap
                          size={16}
                          className="text-blue-600 fill-blue-500"
                        />
                        <span className="text-blue-600 dark:text-blue-400">
                          Cơ bản
                        </span>
                      </>
                    ) : (
                      <>
                        <Brain
                          size={16}
                          className="text-purple-600 fill-purple-500"
                        />
                        <span className="text-purple-600 dark:text-purple-400">
                          Suy luận
                        </span>
                      </>
                    )}
                    <ChevronDown size={14} className="ml-auto text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[160px] p-1.5 rounded-xl border-slate-200 dark:border-slate-800"
                >
                  <DropdownMenuItem
                    onClick={() => setUseReasoning(false)}
                    className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer"
                  >
                    <Zap size={16} className="text-blue-600 fill-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Cơ bản</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (isVip) {
                        setUseReasoning(true);
                      } else {
                        toast.info(
                          'Vui lòng nâng cấp gói cước để sử dụng tính năng này.'
                        );
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer',
                      !isVip && 'opacity-60'
                    )}
                  >
                    <Brain
                      size={16}
                      className="text-purple-600 fill-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Suy luận</span>
                      {!isVip && (
                        <span className="text-[10px] text-slate-500">
                          Nâng cấp VIP
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Persona Selector */}
              <button
                onClick={() => setIsPersonaModalOpen(true)}
                disabled={isPersonasLoading || isHistoryLoading}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold transition-all',
                  (isPersonasLoading || isHistoryLoading) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                {isPersonasLoading || isHistoryLoading ? (
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                ) : selectedPersona?.avatar_url ? (
                  <img
                    src={selectedPersona.avatar_url}
                    className="w-5 h-5 rounded-full object-cover"
                    alt={selectedPersona.name}
                  />
                ) : (
                  <UserIcon size={16} className="text-slate-500" />
                )}
                <span className="text-slate-700 dark:text-slate-300">
                  {isPersonasLoading || isHistoryLoading
                    ? 'Đang tải...'
                    : selectedPersona?.name || 'Chọn nhân vật'}
                </span>
                {/* <Sparkles size={14} className="text-yellow-500 fill-yellow-500" /> */}
              </button>
            </div>
          }
        >
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
        </ChatHeader>

        {/* Messages Container */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pt-16 pb-24"
        >
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Chào mừng bạn đến với tư vấn pháp luật
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
                        disabled={isHistoryLoading || isMessageSending}
                        className={cn(
                          'p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group',
                          (isHistoryLoading || isMessageSending) &&
                            'opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {isMessageSending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <MessageSquare size={16} />
                          )}
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
                {isLoadingOlder && (
                  <div className="flex justify-center py-4">
                    <Loader2
                      size={20}
                      className="animate-spin text-slate-400"
                    />
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    {/* Move Status/Reasoning INSIDE the message bubble via props */}
                    <ChatMessage
                      role={msg.role}
                      content={msg.content}
                      reasoning_steps={msg.reasoning_steps}
                      status={
                        idx === messages.length - 1 ? currentStatus : null
                      }
                      avatar={
                        msg.role === 'user'
                          ? user?.avatar
                          : getPersonaAvatar(msg.persona_id) ||
                            selectedPersona?.avatar_url
                      }
                      userName={user?.name || 'Người dùng'}
                      isStreaming={msg.isStreaming}
                      sources={msg.sources}
                      persona_id={msg.persona_id}
                      pending_confirmation={
                        msg.pending_confirmation && idx === messages.length - 1
                      }
                      onConfirm={(choice) => handleSendMessage(choice)}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={
                isMessageSending || isHistoryLoading || isPersonasLoading
              }
              isMessageSending={isMessageSending}
              chatId={activeChatId}
              personaId={selectedPersona?.id}
              useReasoning={useReasoning}
              onChatCreated={handleChatCreated}
              onVoiceMessage={handleVoiceMessage}
              onVoiceStatus={handleVoiceStatus}
              onAgentState={handleAgentState}
            />
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

      {/* Persona Selection Overlay */}
      {isPersonaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <button
            onClick={() => {
              setIsPersonaModalOpen(false);
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
              }
            }}
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>

          <div className="relative flex items-center justify-between w-full max-w-4xl">
            {/* Left Arrow */}
            <button
              onClick={handlePrevPersona}
              className="p-4 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <ChevronLeft size={48} />
            </button>

            {/* Persona Content */}
            <div className="flex-1 flex flex-col items-center text-center px-8 animate-in zoom-in duration-500">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative w-48 h-48 rounded-full border-4 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-500/20">
                  {personas[currentPersonaIdx]?.avatar_url ? (
                    <img
                      src={personas[currentPersonaIdx].avatar_url}
                      className="w-full h-full object-cover"
                      alt={personas[currentPersonaIdx].name}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <UserIcon size={64} className="text-slate-600" />
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
                {personas[currentPersonaIdx]?.name}
              </h2>
              <p className="text-xl text-slate-300 max-w-xl mb-12 leading-relaxed">
                {personas[currentPersonaIdx]?.description ||
                  'Hãy để tôi giúp bạn giải quyết các vấn đề pháp luật.'}
              </p>

              <Button
                onClick={handleSelectPersona}
                size="lg"
                className="h-16 px-12 bg-white text-slate-950 hover:bg-blue-50 rounded-2xl text-xl font-bold transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                Chọn nhân vật này
              </Button>
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNextPersona}
              className="p-4 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <ChevronRight size={48} />
            </button>
          </div>

          {/* Progress indicators */}
          <div className="absolute bottom-12 flex gap-2">
            {personas.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  idx === currentPersonaIdx ? 'w-8 bg-blue-500' : 'bg-white/20'
                )}
              />
            ))}
          </div>
        </div>
      )}
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
