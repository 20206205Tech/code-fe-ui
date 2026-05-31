'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  TOKEN_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
} from '../config/app.config';
import { SettingItem, settingsService } from '../services/settings.service';
import { cookieHelper } from './cookie-helper';

const SETTING_KEYS = {
  THEME: 'theme',
  SHOW_EXAMPLE_QUESTIONS: 'show_example_questions',
  SELECTED_PERSONA_ID: 'selected_persona_id',
  AUTO_EXPAND_REASONING: 'auto_expand_reasoning',
  USE_REASONING: 'use_reasoning',
} as const;

interface Settings {
  theme: string;
  showExampleQuestions: boolean;
  selectedPersonaId?: string;
  autoExpandReasoning: boolean;
  useReasoning: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  showExampleQuestions: true,
  selectedPersonaId: undefined,
  autoExpandReasoning: true,
  showVoiceSuggestions: SHOW_VOICE_TEXT_SUGGESTIONS,
  useReasoning: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  syncSettings: (token: string) => Promise<void>;
  clearSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load from localStorage on mount (do not treat dev-only flags as user settings)
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
          selectedPersonaId: parsed.selectedPersonaId || prev.selectedPersonaId,
          autoExpandReasoning:
            parsed.autoExpandReasoning !== undefined
              ? parsed.autoExpandReasoning
              : prev.autoExpandReasoning,
          useReasoning:
            parsed.useReasoning !== undefined
              ? parsed.useReasoning
              : prev.useReasoning,
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
          if (item.key === SETTING_KEYS.THEME) newSettings.theme = item.value;
          if (item.key === SETTING_KEYS.SHOW_EXAMPLE_QUESTIONS)
            newSettings.showExampleQuestions = item.value === 'true';
          if (item.key === SETTING_KEYS.SELECTED_PERSONA_ID)
            newSettings.selectedPersonaId = item.value;
          if (item.key === SETTING_KEYS.AUTO_EXPAND_REASONING)
            newSettings.autoExpandReasoning = item.value === 'true';
          if (item.key === SETTING_KEYS.USE_REASONING)
            newSettings.useReasoning = item.value === 'true';
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
        apiPayload.push({ key: SETTING_KEYS.THEME, value: newSettings.theme });
      }
      if (newSettings.showExampleQuestions !== undefined) {
        apiPayload.push({
          key: SETTING_KEYS.SHOW_EXAMPLE_QUESTIONS,
          value: String(newSettings.showExampleQuestions),
        });
      }
      if (newSettings.selectedPersonaId) {
        apiPayload.push({
          key: SETTING_KEYS.SELECTED_PERSONA_ID,
          value: newSettings.selectedPersonaId,
        });
      }
      if (newSettings.autoExpandReasoning !== undefined) {
        apiPayload.push({
          key: SETTING_KEYS.AUTO_EXPAND_REASONING,
          value: String(newSettings.autoExpandReasoning),
        });
      }
      if (newSettings.useReasoning !== undefined) {
        apiPayload.push({
          key: SETTING_KEYS.USE_REASONING,
          value: String(newSettings.useReasoning),
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

  const clearSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, syncSettings, clearSettings }}
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
