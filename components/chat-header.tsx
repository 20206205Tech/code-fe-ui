'use client';

import React from 'react';

interface ChatHeaderProps {
  children?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export function ChatHeader({ children, leftContent }: ChatHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30">
      <div className="flex-1 flex items-center justify-start gap-4">
        {leftContent}
      </div>

      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
