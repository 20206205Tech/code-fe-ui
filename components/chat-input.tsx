'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Paperclip,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/auth-context';
import { documentService, DocumentInfo } from '@/services/document.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInputProps {
  onSend: (message: string, docIds?: string[]) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { settings } = useSettings();
  const { subscription, user } = useAuth() as any; // Cast as any if not in type yet
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Document states
  const [isUploading, setIsUploading] = useState(false);
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const isVip = subscription?.status === 'active' || user?.role === 'admin';
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
        if (settings.autoSendVoice) {
          onSend(
            transcript,
            docs.map((d) => d.id)
          );
          setMessage('');
        } else {
          setMessage((prev) => {
            const newMsg = prev ? `${prev.trim()} ${transcript}` : transcript;
            return newMsg;
          });
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onSend, settings.autoSendVoice, docs]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (docs.length + selectedFiles.length > 5) {
      toast.error('Chỉ được phép đính kèm tối đa 5 tài liệu.');
      return;
    }

    setIsUploading(true);

    for (const file of selectedFiles) {
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

        setDocs((prev) => [...prev, newDoc]);
        startPolling(data.doc_id);
      } catch (error) {
        toast.error(`Tải lên ${file.name} thất bại.`);
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
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
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {doc.status === 'UPLOADED'
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
                <X size={12} className="text-red-500" />
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
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
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
              accept=".pdf,.doc,.docx,.txt"
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
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={!canSend}
              className="rounded-full h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 disabled:opacity-30 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
