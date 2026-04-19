import { Bot, User as UserIcon } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  userName?: string;
}

export function ChatMessage({
  role,
  content,
  avatar,
  userName = 'User',
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-4 py-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          avatar ? (
            <img
              src={avatar}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <UserIcon size={20} />
            </div>
          )
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Bot size={20} className="text-slate-700 dark:text-slate-300" />
          </div>
        )}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-2xl ${isUser ? 'text-right' : ''}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
          }`}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
