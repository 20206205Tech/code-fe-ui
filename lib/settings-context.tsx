'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { USER_SETTINGS_STORAGE_KEY } from '../config/app.config';

interface Settings {
  theme: string;
  language: string;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
};

const SettingsContext = createContext<
  | {
      settings: Settings;
      updateSettings: (newSettings: Partial<Settings>) => void;
    }
  | undefined
>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Lỗi parse settings:', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(updated));

      // Tương lai: Gọi API tại đây (ví dụ: axios.patch('/api/settings', updated))
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
