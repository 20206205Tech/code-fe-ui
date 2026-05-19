'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SUGGESTION_VOICE, VOICE_SUGGESTIONS } from '@/config/voice.config';
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
  voiceId?: string;
  isVip: boolean;
  onMessage?: (role: string, content: string, isFinal: boolean, sources?: any[]) => void;
  onStatus?: (message: string, hidden?: boolean) => void;
  onAgentState?: (isReasoning: boolean) => void;
  disabled?: boolean;
}

export interface VoiceSessionHandle {
  sendTextMessage: (text: string) => boolean;
  isActive: boolean;
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
  onMessage?: (role: string, content: string, isFinal: boolean, sources?: any[]) => void;
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

    const isDuplicate = (role: string, text: string, isFinal: boolean, hasSources: boolean = false) => {
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
          if (text && !isDuplicate(data.role, text, data.isFinal || false, hasSources)) {
            onMessage?.(data.role, text, data.isFinal || false, data.sources);
          }
        }
        if (data.type === 'status') {
          onStatus?.(data.message, data.hidden);
        }
        if (data.type === 'agent_state') {
          onAgentState?.(data.is_reasoning);
        }
      } catch (e) { }
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
    const handleSendDev = (overrideText?: string) => {
      // Dùng giá trị overrideText nếu có (khi click nút gợi ý) hoặc devInput
      const textToPublish = typeof overrideText === 'string' ? overrideText : devInput;
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
        {/* Chỉ hiển thị ô nhập liệu dev này trong môi trường development */}
        <div className="absolute bottom-full mb-3 right-0 flex flex-col gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50 min-w-[320px]">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg shrink-0">
              <MessageSquare size={14} className="text-blue-600" />
            </div>
            <input
              type="text"
              value={devInput}
              onChange={(e) => setDevInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendDev()}
              placeholder="Nhập nội dung muốn 'nói'..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 dark:text-slate-200 min-w-0"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 shrink-0"
              onClick={() => handleSendDev()}
            >
              <Send size={14} />
            </Button>
          </div>
          {SUGGESTION_VOICE && (
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              {VOICE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendDev(suggestion)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

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
  voiceId,
}: {
  chatId: string;
  userId: string;
  fileIds: string[];
  useReasoning: boolean;
  voiceId?: string;
}) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const prevMetadataRef = useRef<string>('');

  useEffect(() => {
    if (room && connectionState === ConnectionState.Connected) {
      const newMetadata = JSON.stringify({
        chat_id: chatId,
        user_id: userId,
        file_ids: fileIds,
        use_reasoning: useReasoning,
        voice_id: voiceId,
      });

      // Chỉ gửi lên LiveKit nếu thực sự có sự thay đổi về mặt giá trị
      if (newMetadata === prevMetadataRef.current) {
        return;
      }

      prevMetadataRef.current = newMetadata;

      console.log(
        '--- [MetadataSync] Đang đồng bộ Metadata mới sang LiveKit ---'
      );
      room.localParticipant.setMetadata(newMetadata).catch((err) => {
        console.error('Lỗi cập nhật metadata sang LiveKit:', err);
      });
    }
  }, [
    chatId,
    userId,
    JSON.stringify(fileIds), // Tránh so sánh tham chiếu mảng (reference array)
    useReasoning,
    voiceId,
    connectionState,
    room,
  ]);

  return null;
}

export const VoiceSession = forwardRef<VoiceSessionHandle, VoiceSessionProps>(
  (
    {
      chatId,
      userId,
      fileIds,
      useReasoning,
      voiceId,
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
    }));

    // Tự động ngắt kết nối khi chuyển chat
    useEffect(() => {
      if (token || serverUrl) {
        handleEndSession();
      }
    }, [chatId]);

    const handleStartSession = async () => {
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
          voiceId
        );
        if (response && response.token) {
          setToken(response.token);
          setServerUrl(response.serverUrl);
        } else {
          toast.error('Không thể lấy token kết nối');
        }
      } catch (error) {
        console.error('Failed to get voice token:', error);
        toast.error('Lỗi kết nối phiên thoại');
      } finally {
        setIsGettingToken(false);
      }
    };

    const handleEndSession = () => {
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
          onConnected={(room) => {
            roomRef.current = room;
          }}
          onError={(err) => {
            console.error('LiveKit connection error:', err);
            toast.error('Lỗi kết nối phiên thoại');
            handleEndSession();
          }}
        >
          <RoomAudioRenderer />
          <MetadataSync
            chatId={chatId}
            userId={userId}
            fileIds={fileIds}
            useReasoning={useReasoning}
            voiceId={voiceId}
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
