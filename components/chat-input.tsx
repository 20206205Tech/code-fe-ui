'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { cn } from '@/lib/utils';
import { DocumentInfo, documentService } from '@/services/document.service';
import {
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { VoiceSessionHandle } from './voice-session';
import { VoiceSession } from './voice-session';

interface ChatInputProps {
  onSend: (message: string, docIds?: string[]) => void;
  isLoading?: boolean;
  chatId?: string | null;
  onChatCreated?: (chatId: string) => void;
  onVoiceMessage?: (
    role: string,
    content: string,
    isFinal: boolean,
    sources?: any[],
    pending_confirmation?: boolean
  ) => void;
  onVoiceStatus?: (message: string, hidden?: boolean) => void;
  onAgentState?: (isReasoning: boolean) => void;
  voiceId?: string;
  isMessageSending?: boolean;
  useReasoning?: boolean;
}

export function ChatInput({
  onSend,
  isLoading = false,
  chatId,
  onChatCreated,
  onVoiceMessage,
  onVoiceStatus,
  onAgentState,
  voiceId,
  isMessageSending = false,
  useReasoning = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [tempTranscript, setTempTranscript] = useState('');

  const { settings } = useSettings();
  const { subscription, user } = useAuth();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const voiceRef = useRef<VoiceSessionHandle | null>(null);
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const prevChatIdRef = useRef<string | null | undefined>(chatId);

  const isVip = subscription?.has_active_subscription === true;

  useEffect(() => {
    console.log(
      '[ChatInput] isVip status changed:',
      isVip,
      'subscription:',
      subscription
    );
  }, [isVip, subscription]);

  useEffect(() => {
    // Clear docs when:
    // 1. Moving to "New Chat" (chatId is null/undefined)
    // 2. Moving from one existing chat to another existing chat
    if (chatId !== prevChatIdRef.current) {
      const movedToNewChat = !chatId;
      const switchedBetweenChats =
        prevChatIdRef.current && chatId && prevChatIdRef.current !== chatId;

      if (movedToNewChat || switchedBetweenChats) {
        setDocs([]);
        // Clear all polling intervals
        pollingIntervals.current.forEach((interval) => clearInterval(interval));
        pollingIntervals.current.clear();
      }
      prevChatIdRef.current = chatId;
    }
  }, [chatId]);

  const isProcessing =
    isUploading ||
    docs.some((d) => d.status !== 'COMPLETED' && d.status !== 'FAILED');
  const canSend = message.trim() && !isLoading && !isProcessing;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error(`Lỗi nhận diện giọng nói: ${event.error}`);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTempTranscript(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, [onSend, docs]);

  const startPolling = (docId: string) => {
    // Clear existing interval if any for this specific ID
    if (pollingIntervals.current.has(docId)) {
      clearInterval(pollingIntervals.current.get(docId));
    }

    const interval = setInterval(async () => {
      try {
        const info = await documentService.getDocumentStatus(docId);

        setDocs((prev) => prev.map((d) => (d.id === docId ? info : d)));

        if (info.status === 'COMPLETED' || info.status === 'FAILED') {
          // Kiểm tra xem liệu doc này còn trong danh sách polling không (tránh race condition khi user đã xóa)
          if (!pollingIntervals.current.has(docId)) {
            clearInterval(interval);
            return;
          }

          clearInterval(interval);
          pollingIntervals.current.delete(docId);

          if (info.status === 'COMPLETED') {
            toast.success(`Xử lý ${info.filename} thành công!`);
          } else {
            toast.error(`Xử lý ${info.filename} thất bại.`);
          }
        }
      } catch (error) {
        console.error(`Polling error for ${docId}:`, error);
      }
    }, 2000);

    pollingIntervals.current.set(docId, interval);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (docs.length + files.length > 5) {
      toast.error('Chỉ được phép đính kèm tối đa 5 tài liệu.');
      return;
    }

    setIsUploading(true);

    // Create optimistic docs and keep a local copy for synchronous updates
    const tempDocs: DocumentInfo[] = files.map((file) => ({
      id: `temp-${Date.now()}-${file.name}`,
      filename: file.name,
      status: 'UPLOADING',
      has_file: false,
      has_content: false,
      has_summary: false,
    }));

    let currentDocs: DocumentInfo[] = [...docs, ...tempDocs];
    setDocs(currentDocs);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = tempDocs[i].id;

      try {
        const data = await documentService.uploadDocument(file);
        const newDoc: DocumentInfo = {
          id: data.doc_id,
          filename: data.filename,
          status: 'UPLOADED',
          has_file: true,
          has_content: false,
          has_summary: false,
        };

        // Replace temp doc with real doc in our local copy and update state
        currentDocs = currentDocs.map((d) => (d.id === tempId ? newDoc : d));
        setDocs(currentDocs);
        startPolling(data.doc_id);
      } catch (error) {
        toast.error(`Tải lên ${file.name} thất bại.`);
        console.error('Upload error:', error);
        // Update status to FAILED for the specific temp doc
        currentDocs = currentDocs.map((d) =>
          d.id === tempId ? { ...d, status: 'FAILED' } : d
        );
        setDocs(currentDocs);
      }
    }

    setIsUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    await uploadFiles(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!isVip) return;

    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, {
            type: blob.type,
          });
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await uploadFiles(imageFiles);
    }
  };

  const handleRetry = async (docId: string) => {
    try {
      // Update status to processing immediately
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'PROCESSING' } : d))
      );

      await documentService.retryDocument(docId);
      startPolling(docId);
      toast.info('Đang thử lại xử lý tài liệu...');
    } catch (error) {
      toast.error('Gửi yêu cầu thử lại thất bại.');
      console.error('Retry error:', error);
      // Revert status to FAILED if retry request fails
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'FAILED' } : d))
      );
    }
  };

  const removeDocument = (docId: string) => {
    if (pollingIntervals.current.has(docId)) {
      clearInterval(pollingIntervals.current.get(docId));
      pollingIntervals.current.delete(docId);
    }
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach((interval) => clearInterval(interval));
      pollingIntervals.current.clear();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setIsVoiceMode(true);
        setTempTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const cancelVoice = () => {
    if (isListening) recognitionRef.current.stop();
    setIsVoiceMode(false);
    setTempTranscript('');
  };

  const confirmVoice = () => {
    if (isListening) recognitionRef.current.stop();
    if (tempTranscript) {
      setMessage((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${tempTranscript}` : tempTranscript;
      });
    }
    setIsVoiceMode(false);
    setTempTranscript('');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onSend(
        message,
        docs.map((d) => d.id)
      );
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* Document Status Indicators */}
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2"
            >
              <FileText size={14} className="text-blue-500" />
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                {doc.filename}
              </span>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  doc.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : doc.status === 'FAILED'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : doc.status === 'UPLOADING'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {doc.status === 'UPLOADING'
                  ? 'Tải lên...'
                  : doc.status === 'UPLOADED'
                    ? 'Đã tải'
                    : doc.status === 'PROCESSING'
                      ? 'Xử lý...'
                      : doc.status === 'COMPLETED'
                        ? 'OK'
                        : 'Lỗi'}
              </span>
              {doc.status === 'COMPLETED' ? (
                <CheckCircle2 size={12} className="text-green-500" />
              ) : doc.status === 'FAILED' ? (
                <div className="flex items-center gap-1">
                  <X size={12} className="text-red-500" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleRetry(doc.id)}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors text-red-500"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-[10px]">Thử lại</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <Loader2 size={12} className="animate-spin text-blue-500" />
              )}
              <button
                type="button"
                onClick={() => removeDocument(doc.id)}
                className="ml-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={12} className="text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="relative flex-1 flex items-end bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:border-blue-600 dark:focus-within:border-blue-500 transition-colors">
          {isVoiceMode ? (
            <div className="flex-1 flex items-center justify-between px-4 py-3 min-h-[50px]">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelVoice}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full h-9 w-9"
              >
                <Trash2 size={18} />
              </Button>

              <div className="flex-1 flex flex-col items-center px-4">
                {isListening ? (
                  <div className="flex items-center gap-1.5 h-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-500 rounded-full animate-voice-bar"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          height: '4px',
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {tempTranscript ? 'Đã nhận diện' : 'Đang chờ...'}
                  </p>
                )}
                <p className="text-sm text-slate-900 dark:text-white font-medium line-clamp-1 text-center">
                  {tempTranscript || (isListening ? 'Đang nghe...' : '')}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={confirmVoice}
                className="text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full h-9 w-9"
              >
                <Check size={20} />
              </Button>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Nhập tin nhắn..."
                disabled={
                  isLoading ||
                  (isProcessing && docs.every((d) => d.status !== 'COMPLETED'))
                }
                className="flex-1 px-4 py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none resize-none"
                rows={1}
              />
              <div className="pb-2 pr-2 flex items-center gap-1">
                {/* File Upload Button (Always shown, but muted/disabled for non-VIP) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  multiple
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isVip) {
                            fileInputRef.current?.click();
                          } else {
                            toast.info(
                              'Vui lòng nâng cấp gói cước để sử dụng tính năng này.'
                            );
                          }
                        }}
                        disabled={isLoading || isProcessing}
                        className={cn(
                          'rounded-full h-9 w-9 transition-all duration-300',
                          isVip
                            ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'text-slate-400 dark:text-slate-600 opacity-40 hover:opacity-100'
                        )}
                      >
                        <Paperclip size={18} />
                      </Button>
                    </TooltipTrigger>
                    {!isVip && (
                      <TooltipContent side="top">
                        <p className="text-xs">Nâng cấp VIP để tải tài liệu</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  disabled={isLoading || isProcessing}
                  className={`rounded-full h-9 w-9 transition-all duration-300 ${
                    isListening
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>

                <VoiceSession
                  chatId={chatId || ''}
                  userId={user?.id || ''}
                  fileIds={docs
                    .filter(
                      (d) =>
                        d.has_file ||
                        d.status === 'UPLOADED' ||
                        d.status === 'COMPLETED'
                    )
                    .map((d) => d.id)}
                  useReasoning={useReasoning}
                  voiceId={voiceId}
                  isVip={isVip}
                  ref={voiceRef}
                  onChatCreated={onChatCreated}
                  onMessage={onVoiceMessage}
                  onStatus={onVoiceStatus}
                  onAgentState={onAgentState}
                  disabled={isLoading || isProcessing}
                />

                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={!canSend}
                  className="rounded-full h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 disabled:opacity-30 flex-shrink-0"
                >
                  {isMessageSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
