'use client';

import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { Sidebar } from '@/components/sidebar';
import { UserMenuHeader } from '@/components/user-menu-header';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate API call - for now, respond with default content
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantMessage: Message = {
        role: 'assistant',
        content:
          'Đây là phản hồi mặc định từ trợ lý AI. Tính năng chat đang ở chế độ demo.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-0">
        {/* Header */}
        <UserMenuHeader />

        {/* Messages Container */}
        <main className="flex-1 overflow-y-auto pt-16 pb-24">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome to Chat
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  Start a conversation by sending a message. I&apos;m here to
                  help!
                </p>
              </div>
            ) : (
              <div className="p-4 md:p-6">
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    role={msg.role}
                    content={msg.content}
                    avatar={msg.role === 'user' ? user?.avatar : undefined}
                    userName={user?.name || 'User'}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-4 py-6">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}
