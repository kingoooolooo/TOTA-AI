import type { AppSettings, ModelOption, Session } from "../types";
import { normalizeBaseUrl } from "../utils/urlUtils";

const SESSIONS_KEY = "amaanai_sessions";
const SETTINGS_KEY = "amaanai_settings";
const ACTIVE_MODEL_KEY = "amaanai_active_model";
const OPENROUTER_MODELS_KEY = "amaanai_openrouter_models";

interface OpenRouterModelCache {
  fetchedAt: string;
  models: ModelOption[];
}

export const defaultSettings: AppSettings = {
  username: "Ayan",
  appName: import.meta.env.VITE_APP_NAME ?? "Ayan AI",
  theme: "dark",
  accentColor: "#7c3aed",
  fontSize: "medium",
  mimoBaseUrl: import.meta.env.VITE_MIMO_BASE_URL ?? "https://api.xiaomimimo.com/v1",
  mimoApiKey: "",
  openRouterApiKey: "",
  defaultModel: "mimo-v2.5-pro",
  defaultProvider: "mimo",
  systemPrompt: "",
  autoTTS: false,
  asrLanguage: "en",
  maxRecordingDuration: 60,
  ttsVoice: "default"
};

const isBrowser = (): boolean => typeof window !== "undefined";

const encodeSecret = (value: string): string => {
  if (!value) return "";
  try {
    return btoa(value);
  } catch {
    return value;
  }
};

const decodeSecret = (value: string): string => {
  if (!value) return "";
  try {
    return atob(value);
  } catch {
    return value;
  }
};

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const normalizeMimoBaseUrl = (baseUrl: string): string => {
  const normalized = normalizeBaseUrl(baseUrl || defaultSettings.mimoBaseUrl);
  return /api\.(mimo-v2|mimo)\.ai|api\.mimo-v2\.com/i.test(normalized)
    ? defaultSettings.mimoBaseUrl
    : normalized;
};

const normalizeAppName = (appName?: string): string => {
  if (!appName || /^(amaanai|amaan ai|ayanai)$/i.test(appName.trim())) return "Ayan AI";
  return appName;
};

const normalizeUsername = (username?: string): string => {
  if (!username || /^amaan$/i.test(username.trim())) return "Ayan";
  return username;
};

const normalizeSettings = (settings: Partial<AppSettings>): AppSettings => {
  const savedModel = settings.defaultModel ?? defaultSettings.defaultModel;

  return {
    ...defaultSettings,
    ...settings,
    username: normalizeUsername(settings.username),
    appName: normalizeAppName(settings.appName),
    mimoBaseUrl: normalizeMimoBaseUrl(settings.mimoBaseUrl || defaultSettings.mimoBaseUrl),
    defaultModel: savedModel,
    defaultProvider: settings.defaultProvider ?? defaultSettings.defaultProvider,
    mimoApiKey: decodeSecret(settings.mimoApiKey ?? ""),
    openRouterApiKey: decodeSecret(settings.openRouterApiKey ?? "")
  };
};

export const getSettings = (): AppSettings => {
  if (!isBrowser()) return defaultSettings;
  return normalizeSettings(parseJson<Partial<AppSettings>>(localStorage.getItem(SETTINGS_KEY), {}));
};

export const saveSettings = (settings: AppSettings): void => {
  if (!isBrowser()) return;
  const serialized: AppSettings = {
    ...settings,
    mimoApiKey: encodeSecret(settings.mimoApiKey),
    openRouterApiKey: encodeSecret(settings.openRouterApiKey)
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(serialized));
};

const isSession = (value: unknown): value is Session => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.id === "string" &&
    (candidate.type === "chat" || candidate.type === "coder") &&
    Array.isArray(candidate.messages) &&
    Array.isArray(candidate.files)
  );
};

export const getSessions = (): Session[] => {
  if (!isBrowser()) return [];
  const parsed = parseJson<unknown[]>(localStorage.getItem(SESSIONS_KEY), []);
  return parsed.filter(isSession);
};

export const saveSessions = (sessions: Session[]): void => {
  if (!isBrowser()) return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const saveSession = (session: Session): Session[] => {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex((item) => item.id === session.id);
  const nextSessions =
    existingIndex >= 0
      ? sessions.map((item) => (item.id === session.id ? session : item))
      : [session, ...sessions];

  saveSessions(nextSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  return nextSessions;
};

export const exportAllData = (): string => {
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    sessions: getSessions()
  };
  return JSON.stringify(payload, null, 2);
};

export const clearAllData = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(ACTIVE_MODEL_KEY);
};

export const getOpenRouterModelCache = (): OpenRouterModelCache | null => {
  if (!isBrowser()) return null;
  return parseJson<OpenRouterModelCache | null>(localStorage.getItem(OPENROUTER_MODELS_KEY), null);
};

export const saveOpenRouterModelCache = (models: ModelOption[]): void => {
  if (!isBrowser()) return;
  localStorage.setItem(
    OPENROUTER_MODELS_KEY,
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      models
    })
  );
};
