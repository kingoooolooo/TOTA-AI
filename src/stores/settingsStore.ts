import { create } from "zustand";
import type { AppSettings, Provider } from "../types";
import { defaultSettings, getSettings, saveSettings } from "../services/storageService";

interface SettingsState {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setActiveModel: (model: string, provider: Provider) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: getSettings(),
  updateSettings: (patch) => {
    const nextSettings = { ...get().settings, ...patch };
    saveSettings(nextSettings);
    set({ settings: nextSettings });
  },
  resetSettings: () => {
    saveSettings(defaultSettings);
    set({ settings: defaultSettings });
  },
  setActiveModel: (model, provider) => {
    get().updateSettings({
      defaultModel: model,
      defaultProvider: provider
    });
  }
}));
