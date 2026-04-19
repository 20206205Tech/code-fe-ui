'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  USER_SETTINGS_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '../config/app.config';
import { settingsService, SettingItem } from '../services/settings.service';
import { cookieHelper } from './cookie-helper';

interface Settings {
  theme: string;
  showExampleQuestions: boolean;
  autoSendVoice: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  showExampleQuestions: true,
  autoSendVoice: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  syncSettings: (token: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({
          ...prev,
          theme: parsed.theme || prev.theme,
          showExampleQuestions:
            parsed.showExampleQuestions !== undefined
              ? parsed.showExampleQuestions
              : prev.showExampleQuestions,
          autoSendVoice:
            parsed.autoSendVoice !== undefined
              ? parsed.autoSendVoice
              : prev.autoSendVoice,
        }));
      } catch (e) {
        console.error('Lỗi parse settings:', e);
      }
    }
  }, []);

  const syncSettings = async (token: string) => {
    try {
      const apiSettings = await settingsService.getSettings(token);
      if (apiSettings && apiSettings.length > 0) {
        const newSettings: Partial<Settings> = {};

        apiSettings.forEach((item) => {
          if (item.key === 'theme') newSettings.theme = item.value;
          if (item.key === 'show_example_questions')
            newSettings.showExampleQuestions = item.value === 'true';
          if (item.key === 'auto_send_voice')
            newSettings.autoSendVoice = item.value === 'true';
        });

        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(
          USER_SETTINGS_STORAGE_KEY,
          JSON.stringify(updated)
        );
      }
    } catch (error) {
      console.error('Failed to sync settings with API:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    // 1. Update state locally for immediate UI response
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // 2. Update localStorage
    const saved = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    const current = saved ? JSON.parse(saved) : settings;
    const updated = { ...current, ...newSettings };
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // 3. Sync with API if authenticated
    const tokens = cookieHelper.get(TOKEN_STORAGE_KEY);
    if (tokens?.access_token) {
      const apiPayload: SettingItem[] = [];
      if (newSettings.theme) {
        apiPayload.push({ key: 'theme', value: newSettings.theme });
      }
      if (newSettings.showExampleQuestions !== undefined) {
        apiPayload.push({
          key: 'show_example_questions',
          value: String(newSettings.showExampleQuestions),
        });
      }
      if (newSettings.autoSendVoice !== undefined) {
        apiPayload.push({
          key: 'auto_send_voice',
          value: String(newSettings.autoSendVoice),
        });
      }

      if (apiPayload.length > 0) {
        try {
          await settingsService.updateSettings(tokens.access_token, apiPayload);
        } catch (error) {
          console.error('Failed to update settings on server:', error);
        }
      }
    }
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, syncSettings }}
    >
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
