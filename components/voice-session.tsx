'use client';

import { Button } from '@/components/ui/button';
import {
  SHOW_VOICE_TEXT_SUGGESTIONS,
  VOICE_SUGGESTIONS,
} from '@/config/voice.config';
import { cn } from '@/lib/utils';
import { conversationService } from '@/services/conversation.service';
import { AudioLines, Loader2, MessageSquare, Send } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  ConnectionState,
  RemoteParticipant,
  RoomEvent,
  TranscriptionSegment,
} from 'livekit-client';

interface VoiceSessionProps {
  chatId: string;
  userId: string;
  fileIds: string[];
  useReasoning: boolean;
  personaId?: string;
  isVip: boolean;
  onMessage?: (
    role: string,
    content: string,
    isFinal: boolean,
    sources?: any[],
    pending_confirmation?: boolean
  ) => void;
  onStatus?: (message: string, hidden?: boolean) => void;
  onAgentState?: (isReasoning: boolean) => void;
  disabled?: boolean;
  onChatCreated?: (chatId: string) => void;
}

export interface VoiceSessionHandle {
  sendTextMessage: (text: string) => boolean;
  isActive: boolean;
  refreshMetadata?: (fileIds?: string[]) => void;
}

/**
 * Component hiển thị trạng thái kết nối động
 */
export function VoiceSessionUI({
  onDisconnect,
  onMessage,
  onStatus,
  onAgentState,
}: {
  onDisconnect: () => void;
  onMessage?: (
    role: string,
    content: string,
    isFinal: boolean,
    sources?: any[],
    pending_confirmation?: boolean
  ) => void;
  onStatus?: (message: string, hidden?: boolean) => void;
  onAgentState?: (isReasoning: boolean) => void;
}) {
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const [devInput, setDevInput] = useState('');

  const lastProcessedFinalText = useRef<Record<string, string>>({});
  const lastProcessedTime = useRef<Record<string, number>>({});

  // Lắng nghe cả Data Channel và Transcription để đảm bảo nhận được text từ cả 2 phía (User & Agent)
  useEffect(() => {
    if (!room) return;

    const isDuplicate = (
      role: string,
      text: string,
      isFinal: boolean,
      hasSources: boolean = false
    ) => {
      if (!isFinal) return false;

      // Nếu tin nhắn có chứa sources (từ Data Channel gửi sang), ta tuyệt đối KHÔNG chặn trùng lặp,
      // vì ta cần đưa sources này vào để giao diện cập nhật nguồn hiển thị!
      if (hasSources) {
        return false;
      }

      const now = Date.now();
      const normalizedText = text.trim();
      const lastText = lastProcessedFinalText.current[role];
      const lastTime = lastProcessedTime.current[role] || 0;

      // Nếu nội dung giống hệt và cách nhau chưa đến 1.5 giây, coi là trùng lặp
      if (normalizedText === lastText && now - lastTime < 1500) {
        return true;
      }

      lastProcessedFinalText.current[role] = normalizedText;
      lastProcessedTime.current[role] = now;
      return false;
    };

    // 1. Lắng nghe Transcription chuẩn (Thường cho Agent)
    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: RemoteParticipant | any
    ) => {
      if (!participant || !room.localParticipant) return;
      const isAgent = participant.identity !== room.localParticipant.identity;
      const role = isAgent ? 'agent' : 'user';

      const combinedText = segments
        .map((s) => s.text?.trim())
        .filter(Boolean)
        .join(' ')
        .trim();

      if (combinedText) {
        const isFinal = segments.every((s) => s.final);
        if (!isDuplicate(role, combinedText, isFinal, false)) {
          onMessage?.(role, combinedText, isFinal);
        }
      }
    };

    // 2. Lắng nghe Data Channel (Thường cho User speech từ server trả về)
    const handleData = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'transcription') {
          const text = (data.text || '').trim();
          const hasSources = !!(data.sources && data.sources.length > 0);
          // data.role: 'agent' hoặc 'user'
          if (
            text &&
            !isDuplicate(data.role, text, data.isFinal || false, hasSources)
          ) {
            onMessage?.(
              data.role,
              text,
              data.isFinal || false,
              data.sources,
              data.pending_confirmation
            );
          }
        }
        if (data.type === 'status') {
          onStatus?.(data.message, data.hidden);
        }
        if (data.type === 'agent_state') {
          onAgentState?.(data.is_reasoning);
        }
      } catch (e) {}
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.DataReceived, handleData);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, onMessage, onStatus, onAgentState]);

  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="flex items-center justify-center h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
        <Loader2 size={16} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (connectionState === ConnectionState.Connected) {
    const handleSendVoiceText = (overrideText?: string) => {
      // Dùng giá trị overrideText nếu có (khi click nút gợi ý) hoặc devInput
      const textToPublish =
        typeof overrideText === 'string' ? overrideText : devInput;
      if (!textToPublish.trim()) return;

      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({
          type: 'chat',
          text: textToPublish,
        })
      );
      room.localParticipant.publishData(data, { reliable: true });

      // Nếu là submit từ ô input thông thường thì xóa input
      if (typeof overrideText !== 'string') {
        setDevInput('');
      }
    };

    return (
      <div className="flex flex-col items-end gap-2 relative">
        {SHOW_VOICE_TEXT_SUGGESTIONS && (
          <div className="absolute bottom-full mb-3 right-0 flex flex-col gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50 min-w-[320px]">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg shrink-0">
                <MessageSquare size={14} className="text-blue-600" />
              </div>
              <input
                type="text"
                value={devInput}
                onChange={(e) => setDevInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendVoiceText()}
                placeholder="Nhập nội dung muốn 'nói'..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 dark:text-slate-200 min-w-0"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 shrink-0"
                onClick={() => handleSendVoiceText()}
              >
                <Send size={14} />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              {VOICE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendVoiceText(suggestion)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 bg-red-100 dark:bg-red-900/30 rounded-full border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800/50"
                  onClick={onDisconnect}
                >
                  <AudioLines
                    size={16}
                    className="text-red-600 animate-pulse"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Kết thúc phiên thoại</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Component phụ trợ để đồng bộ Metadata khi đang trong phiên kết nối
 */
function MetadataSync({
  chatId,
  userId,
  fileIds,
  useReasoning,
  personaId,
  pendingMetadataRef,
}: {
  chatId: string;
  userId: string;
  fileIds: string[];
  useReasoning: boolean;
  personaId?: string;
  pendingMetadataRef?: React.MutableRefObject<string | null>;
}) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const prevMetadataRef = useRef<string>('');

  // Reset metadata tracking khi disconnect để đảm bảo metadata được gửi lại khi reconnect
  useEffect(() => {
    if (connectionState === ConnectionState.Disconnected) {
      prevMetadataRef.current = '';
      console.log('[MetadataSync] Reset metadata tracking sau khi disconnect');
    }
  }, [connectionState]);

  // Gửi metadata ngay khi room vừa kết nối
  useEffect(() => {
    if (room && connectionState === ConnectionState.Connected) {
      // If an external pending metadata exists (requested while disconnected), send it first
      if (pendingMetadataRef && pendingMetadataRef.current) {
        const pending = pendingMetadataRef.current;
        if (pending !== prevMetadataRef.current) {
          prevMetadataRef.current = pending;
          console.log(
            '[MetadataSync] Gửi pending metadata lên LiveKit',
            pending
          );
          room.localParticipant.setMetadata(pending).catch((err) => {
            console.error('Lỗi cập nhật pending metadata sang LiveKit:', err);
          });
        }
        pendingMetadataRef.current = null;
        return;
      }

      const newMetadata = JSON.stringify({
        chat_id: chatId,
        user_id: userId,
        file_ids: fileIds,
        use_reasoning: useReasoning,
        persona_id: personaId,
      });

      // Luôn gửi metadata khi room vừa kết nối hoặc khi dependencies thay đổi
      const shouldUpdate = newMetadata !== prevMetadataRef.current;

      if (!shouldUpdate) {
        console.log('[MetadataSync] Metadata không thay đổi, skip update');
        return;
      }

      prevMetadataRef.current = newMetadata;

      console.log('[MetadataSync] Gửi metadata lên LiveKit', {
        chatId,
        userId,
        file_ids: fileIds,
        use_reasoning: useReasoning,
        persona_id: personaId,
      });

      // Gửi metadata
      room.localParticipant
        .setMetadata(newMetadata)
        .then(() => {
          console.log('[MetadataSync] ✅ Metadata đã được gửi thành công');
        })
        .catch((err) => {
          console.error(
            '[MetadataSync] ❌ Lỗi cập nhật metadata sang LiveKit:',
            err
          );
        });
    }
  }, [
    chatId,
    userId,
    JSON.stringify(fileIds),
    useReasoning,
    personaId,
    connectionState,
    room,
  ]);

  return null;
}

/**
 * Component phụ trợ để lưu tham chiếu đến Room
 */
function RoomRefSetter({ roomRef }: { roomRef: React.MutableRefObject<any> }) {
  const room = useRoomContext();
  useEffect(() => {
    if (room) {
      roomRef.current = room;
    }
  }, [room, roomRef]);
  return null;
}

export const VoiceSession = forwardRef<VoiceSessionHandle, VoiceSessionProps>(
  (
    {
      chatId,
      userId,
      fileIds,
      useReasoning,
      personaId,
      isVip,
      onChatCreated,
      onMessage,
      onStatus,
      onAgentState,
      disabled = false,
    },
    ref
  ) => {
    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [activeSessionChatId, setActiveSessionChatId] = useState<
      string | null
    >(null);
    const [isGettingToken, setIsGettingToken] = useState(false);

    // Tham chiếu đến room hiện tại để gửi dữ liệu
    const roomRef = useRef<any>(null);
    // Nếu refreshMetadata được gọi khi room chưa connected, lưu metadata vào đây để gửi khi connect
    const pendingMetadataRef = useRef<string | null>(null);

    // Refs để luôn đọc được giá trị props mới nhất trong callbacks/effects (tránh stale closure)
    const chatIdRef = useRef(chatId);
    const userIdRef = useRef(userId);
    const fileIdsRef = useRef(fileIds);
    const useReasoningRef = useRef(useReasoning);
    const personaIdRef = useRef(personaId);
    const tokenRef = useRef(token);
    const serverUrlRef = useRef(serverUrl);

    // Đồng bộ refs với props/state mới nhất mỗi render (sync trực tiếp, không qua useEffect)
    chatIdRef.current = chatId;
    userIdRef.current = userId;
    fileIdsRef.current = fileIds;
    useReasoningRef.current = useReasoning;
    personaIdRef.current = personaId;
    tokenRef.current = token;
    serverUrlRef.current = serverUrl;

    // Helper: build metadata JSON từ refs (luôn dùng giá trị mới nhất)
    const buildMetadata = (overrideFileIds?: string[]) =>
      JSON.stringify({
        chat_id: chatIdRef.current,
        user_id: userIdRef.current,
        file_ids: overrideFileIds ?? fileIdsRef.current,
        use_reasoning: useReasoningRef.current,
        persona_id: personaIdRef.current,
      });

    // Xuất hàm gửi tin nhắn ra ngoài cho ChatInput dùng
    useImperativeHandle(ref, () => ({
      sendTextMessage: (text: string) => {
        if (
          roomRef.current &&
          roomRef.current.state === ConnectionState.Connected
        ) {
          const encoder = new TextEncoder();
          const data = encoder.encode(
            JSON.stringify({
              type: 'chat',
              text: text,
            })
          );
          roomRef.current.localParticipant.publishData(data, {
            reliable: true,
          });
          return true;
        }
        return false;
      },
      isActive: !!token && !!serverUrl,
      // Force refresh metadata on demand (used by ChatInput after upload)
      refreshMetadata: (fileIdsParam?: string[]) => {
        try {
          const room = roomRef.current;
          const metadata = buildMetadata(fileIdsParam);

          if (!room || room.state !== ConnectionState.Connected) {
            pendingMetadataRef.current = metadata;
            console.log(
              '[VoiceSession] refreshMetadata: queued metadata (room not connected)',
              metadata
            );
            return;
          }

          room.localParticipant
            .setMetadata(metadata)
            .then(() => {
              console.log(
                '[VoiceSession] refreshMetadata: metadata sent',
                metadata
              );
            })
            .catch((err: any) => {
              console.error('[VoiceSession] refreshMetadata error:', err);
            });
        } catch (err) {
          console.error(
            '[VoiceSession] refreshMetadata unexpected error:',
            err
          );
        }
      },
    }));

    // Tự động ngắt kết nối khi chuyển chat (KHÔNG ngắt khi đổi persona)
    // Khi personaId thay đổi, MetadataSync sẽ tự động gửi metadata mới lên LiveKit
    useEffect(() => {
      if (token || serverUrl) {
        handleEndSession();
      }
    }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStartSession = async () => {
      console.log(
        '[VoiceSession] 🎤 Bắt đầu phiên thoại với personaId:',
        personaId
      );
      if (!isVip) {
        toast.info(
          'Vui lòng nâng cấp gói cước để sử dụng tính năng hội thoại thoại.'
        );
        return;
      }

      try {
        setIsGettingToken(true);

        let effectiveChatId = chatId;

        // Tự động tạo phiên chat nếu chưa có
        if (!effectiveChatId) {
          const session = await conversationService.startChat();
          effectiveChatId = session.chatId;
          if (onChatCreated) {
            onChatCreated(effectiveChatId);
          }
        }

        setActiveSessionChatId(effectiveChatId);

        const response = await conversationService.getVoiceSessionToken(
          effectiveChatId,
          fileIds,
          useReasoning,
          personaId
        );
        if (response && response.token) {
          console.log('[VoiceSession] ✅ Token nhận được, kết nối LiveKit');
          setToken(response.token);
          setServerUrl(response.serverUrl);
        } else {
          toast.error('Không thể lấy token kết nối');
        }
      } catch (error: any) {
        console.error('Failed to get voice token:', error);
        const message =
          error?.message || 'Lỗi kết nối phiên thoại. Vui lòng thử lại.';
        toast.error(message);
      } finally {
        setIsGettingToken(false);
      }
    };

    const handleEndSession = () => {
      console.log('[VoiceSession] ❌ Kết thúc phiên thoại');
      setToken(null);
      setServerUrl(null);
      setActiveSessionChatId(null);
    };

    if (!token || !serverUrl) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={handleStartSession}
                disabled={isGettingToken || disabled}
                variant="ghost"
                size="icon"
                className={cn(
                  'rounded-full h-9 w-9 transition-all duration-300',
                  isVip
                    ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'text-slate-400 dark:text-slate-600 opacity-40 hover:opacity-100'
                )}
              >
                {isGettingToken ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AudioLines className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            {!isVip && (
              <TooltipContent side="top">
                <p className="text-xs">Nâng cấp VIP để sử dụng Voice Mode</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <LiveKitRoom
          video={false}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          connect={true}
          connectOptions={{
            autoSubscribe: true,
          }}
          onDisconnected={handleEndSession}
          onConnected={() => {
            // connection established
          }}
          onError={(err) => {
            console.error('LiveKit connection error:', err);
            toast.error('Lỗi kết nối phiên thoại');
            handleEndSession();
          }}
        >
          <RoomAudioRenderer />
          <RoomRefSetter roomRef={roomRef} />
          <MetadataSync
            chatId={chatId}
            userId={userId}
            fileIds={fileIds}
            useReasoning={useReasoning}
            personaId={personaId}
            pendingMetadataRef={pendingMetadataRef}
          />
          <VoiceSessionUI
            onDisconnect={handleEndSession}
            onMessage={onMessage}
            onStatus={onStatus}
            onAgentState={onAgentState}
          />
        </LiveKitRoom>
      </div>
    );
  }
);
