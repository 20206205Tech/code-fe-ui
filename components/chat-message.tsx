import {
  Bot,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { personaService } from '@/services/persona.service';
import { useSettings } from '@/lib/settings-context';

// Global cache for persona avatars to be shared across all message instances
const globalPersonaCache: Record<string, string> = {};

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  userName?: string;
  isStreaming?: boolean;
  sources?: {
    source: string;
    item_id?: string;
    legal_status?: string;
    retrieval_type?: string;
    score?: number;
  }[];
  voice_id?: string | null;
  reasoning_steps?: { content: string; step_order: number; hidden?: boolean }[];
  status?: string | null;
  pending_confirmation?: boolean;
  onConfirm?: (choice: string) => void;
}

export function ChatMessage({
  role,
  content,
  avatar,
  userName = 'User',
  isStreaming,
  sources,
  voice_id,
  reasoning_steps,
  status,
  pending_confirmation,
  onConfirm,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const { settings } = useSettings();
  const [personaAvatar, setPersonaAvatar] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const prevStepsLength = useRef(0);

  // Tự động mở rộng khi có bước suy luận mới (đặc biệt hữu ích cho Voice) nếu cài đặt cho phép
  useEffect(() => {
    if (
      settings.autoExpandReasoning &&
      reasoning_steps &&
      reasoning_steps.length > prevStepsLength.current
    ) {
      setShowSteps(true);
    }
    prevStepsLength.current = reasoning_steps?.length || 0;
  }, [reasoning_steps, settings.autoExpandReasoning]);

  useEffect(() => {
    // Only fetch if it's an assistant message, we have a voice_id, AND no avatar was passed in props
    if (!isUser && voice_id && !avatar) {
      // Check global cache
      if (globalPersonaCache[voice_id]) {
        setPersonaAvatar(globalPersonaCache[voice_id]);
        return;
      }

      const fetchPersona = async () => {
        try {
          // Note: This is now a fallback. Ideally the parent component should resolve the avatar.
          const result = await personaService.getPersonas(1, 1, voice_id);
          const persona = result.items.length > 0 ? result.items[0] : null;

          if (persona?.avatar_url) {
            globalPersonaCache[voice_id] = persona.avatar_url;
            setPersonaAvatar(persona.avatar_url);
          }
        } catch (error) {
          console.error(
            '[ChatMessage] Fallback error fetching persona avatar:',
            error
          );
        }
      };
      fetchPersona();
    }
  }, [isUser, voice_id, avatar]);

  const displayAvatar = avatar || personaAvatar;

  useEffect(() => {
    if (!isUser) {
      console.log(
        `[ChatMessage] Assistant msg - voice_id: ${voice_id}, avatar: ${avatar}, displayAvatar: ${displayAvatar}`
      );
    }
  }, [isUser, voice_id, avatar, displayAvatar]);

  return (
    <div
      className={cn(
        'flex gap-4 py-8 group transition-all duration-500',
        isUser ? 'flex-row-reverse' : 'flex-row',
        'animate-in fade-in slide-in-from-bottom-4'
      )}
    >
      {/* Avatar Section */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            {avatar ? (
              <img
                src={avatar}
                alt={userName}
                className="relative w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md border-2 border-white dark:border-slate-900">
                <UserIcon size={18} />
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-full blur opacity-25"></div>
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="AI Assistant"
                className="relative w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="relative w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Bot size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Content Section */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[85%] md:max-w-[75%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'relative group transition-all duration-300 px-5 py-3.5 shadow-sm',
            isUser
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none shadow-blue-500/10'
              : 'bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-none shadow-slate-200/50 dark:shadow-none'
          )}
        >
          {/* Reasoning Steps Section (Now at the top) */}
          {!isUser && reasoning_steps && reasoning_steps.length > 0 && (
            <div
              className={cn(
                'mb-4 pb-3 border-b border-slate-100 dark:border-white/5',
                !showSteps && 'pb-0 border-b-0'
              )}
            >
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="flex items-center gap-2 text-[11px] font-semibold text-blue-600/70 dark:text-blue-400/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Search size={12} />
                {showSteps
                  ? 'Ẩn chi tiết các bước'
                  : 'Xem chi tiết các bước xử lý'}
                {showSteps ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </button>

              {showSteps && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {reasoning_steps
                    .filter((s) => !s.hidden)
                    .map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-[12px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] p-2 rounded-lg border border-slate-100 dark:border-white/5"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400/50 flex-shrink-0" />
                        <span className="leading-relaxed">{step.content}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Current Status (Spinning) - Moved below steps */}
          {!isUser && isStreaming && status && (
            <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium italic animate-pulse">
              <Activity size={12} className="animate-spin" />
              {status}
            </div>
          )}

          <div
            className={cn(
              'text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300',
              isStreaming && 'animate-in fade-in duration-500'
            )}
          >
            {content}
            {isStreaming && (
              <span className="inline-block ml-2 w-1.5 h-4 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse-fast align-middle shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}
          </div>

          {/* Confirmation Actions */}
          {pending_confirmation && !isStreaming && (
            <div className="mt-4 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                type="button"
                onClick={() => onConfirm?.('Có')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all duration-200"
              >
                <Check size={16} />
                <span>Có, tiếp tục</span>
              </button>
              <button
                type="button"
                onClick={() => onConfirm?.('Không')}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm border border-slate-200/50 dark:border-white/5 active:scale-95 transition-all duration-200"
              >
                <X size={16} />
                <span>Không, dừng lại</span>
              </button>
            </div>
          )}

          {/* Sources Section */}
          {sources && sources.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-blue-500/30 rounded-full"></div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Nguồn trích dẫn
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((src, i) => {
                  const isUrl =
                    src.source.startsWith('http://') ||
                    src.source.startsWith('https://');

                  const linkUrl = isUrl ? src.source : null;
                  return (
                    <div
                      key={i}
                      className="group/source flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all duration-300"
                    >
                      {linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[12px] text-blue-600 dark:text-blue-400 line-clamp-1 group-hover/source:text-blue-500 hover:underline transition-colors flex items-center gap-1"
                        >
                          {src.source}
                          <ExternalLink size={12} className="flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="font-semibold text-[12px] text-blue-600 dark:text-blue-400 line-clamp-1 group-hover/source:text-blue-500 transition-colors">
                          {src.source}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 dark:text-slate-500">
                        {src.retrieval_type && (
                          <span className="bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200/30 dark:border-white/5 text-slate-600 dark:text-slate-400">
                            {src.retrieval_type === 'uploaded_file'
                              ? 'Tài liệu cá nhân'
                              : src.retrieval_type === 'primary'
                                ? 'VBPL (Văn bản pháp luật)'
                                : src.retrieval_type === 'related'
                                  ? 'VBPL (Văn bản pháp luật)'
                                  : src.retrieval_type === 'phap_dien'
                                    ? 'Pháp điển'
                                    : src.retrieval_type}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
