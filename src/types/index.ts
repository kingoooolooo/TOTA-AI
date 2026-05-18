export type Provider = "mimo" | "openrouter";

export type SessionType = "chat" | "coder";

export type ThemePreference = "dark" | "light" | "system";

export type FontSize = "small" | "medium" | "large";

export type Feedback = "thumbs_up" | "thumbs_down" | null;

export interface Attachment {
  id: string;
  filename: string;
  content: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // base64 data URL for images
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  attachments: Attachment[];
  feedback: Feedback;
  audioUrl: string | null;
}

export interface CoderFile {
  path: string;
  content: string;
  language: string;
}

export interface Session {
  id: string;
  type: SessionType;
  title: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  provider: Provider;
  messages: Message[];
  files: CoderFile[];
}

export interface AppSettings {
  username: string;
  appName: string;
  theme: ThemePreference;
  accentColor: string;
  fontSize: FontSize;
  mimoBaseUrl: string;
  mimoApiKey: string;
  openRouterApiKey: string;
  defaultModel: string;
  defaultProvider: Provider;
  systemPrompt: string;
  autoTTS: boolean;
  asrLanguage: string;
  maxRecordingDuration: number;
  ttsVoice: string;
}

export interface ActiveModel {
  model: string;
  provider: Provider;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
  disabled?: boolean;
}

export interface ChatPayloadMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamRequest {
  provider: Provider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  systemPrompt: string;
  messages: Message[];
  temperature?: number;
}

export interface CoderJsonResponse {
  files: Record<string, string>;
  notes?: string;
}

export interface ToastMessage {
  title: string;
  description?: string;
}
