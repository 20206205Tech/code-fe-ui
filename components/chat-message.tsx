import { Bot, User as UserIcon } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  userName?: string;
  sources?: {
    source: string;
    item_id?: string;
    legal_status?: string;
    retrieval_type?: string;
    score?: number;
  }[];
}

export function ChatMessage({
  role,
  content,
  avatar,
  userName = 'User',
  sources,
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
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>

          {/* Sources Section */}
          {sources && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">
                Nguồn trích dẫn
              </p>
              <div className="space-y-2">
                {sources.map((src, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 p-2 rounded bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px]"
                  >
                    <span className="font-semibold text-blue-600 dark:text-blue-400 line-clamp-1">
                      {src.source}
                    </span>
                    <div className="flex gap-2 text-slate-500 dark:text-slate-400">
                      {src.legal_status && (
                        <span className="bg-slate-200 dark:bg-slate-800 px-1 rounded">
                          {src.legal_status}
                        </span>
                      )}
                      {src.retrieval_type && (
                        <span>Type: {src.retrieval_type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
