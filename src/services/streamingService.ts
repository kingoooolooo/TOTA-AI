import type { ChatPayloadMessage, Message, Provider, StreamRequest } from "../types";
import { normalizeBaseUrl } from "../utils/urlUtils";

const DEFAULT_MIMO_BASE_URL = import.meta.env.VITE_MIMO_BASE_URL ?? "https://api.xiaomimimo.com/v1";
const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

interface DeltaChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
  }>;
}

const toPayloadMessages = (messages: Message[], systemPrompt: string): ChatPayloadMessage[] => {
  const payload: ChatPayloadMessage[] = [];
  if (systemPrompt.trim()) {
    payload.push({ role: "system", content: systemPrompt.trim() });
  }

  messages
    .filter((message) => message.role !== "system")
    .forEach((message) => {
      const imageAttachments = message.attachments.filter((a) => a.dataUrl);
      const textAttachments = message.attachments.filter((a) => !a.dataUrl);

      // Build text context from non-image attachments
      const textContext = textAttachments.length > 0
        ? textAttachments.map((a) => `[File: ${a.filename}]\n${a.content}\n[End of file]`).join("\n\n")
        : "";
      const fullText = [textContext, message.content].filter(Boolean).join("\n\n");

      if (imageAttachments.length > 0) {
        // Vision multipart content
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        if (fullText) contentParts.push({ type: "text", text: fullText });
        imageAttachments.forEach((img) => {
          contentParts.push({ type: "image_url", image_url: { url: img.dataUrl! } });
        });
        payload.push({ role: message.role, content: contentParts as unknown as string });
      } else {
        payload.push({ role: message.role, content: fullText });
      }
    });

  return payload;
};

const providerUrl = (provider: Provider, baseUrl?: string): string =>
  provider === "mimo"
    ? `${normalizeBaseUrl(baseUrl ?? DEFAULT_MIMO_BASE_URL)}/chat/completions`
    : `${OPENROUTER_BASE_URL}/chat/completions`;

const providerHeaders = (provider: Provider, apiKey: string): HeadersInit => {
  if (provider === "openrouter") {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Ayan AI"
    };
  }

  return {
    "api-key": apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
};

const extractToken = (json: DeltaChunk): string => {
  const choice = json.choices?.[0];
  return choice?.delta?.content ?? choice?.message?.content ?? "";
};

const readStream = async (response: Response, onToken: (token: string) => void): Promise<string> => {
  if (!response.body) {
    const json = (await response.json()) as DeltaChunk;
    const content = extractToken(json);
    if (content) onToken(content);
    return content;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const data = trimmed.replace(/^data:\s*/, "");
      if (data === "[DONE]") return fullText;

      try {
        const json = JSON.parse(data) as DeltaChunk;
        const token = extractToken(json);
        if (token) {
          fullText += token;
          onToken(token);
        }
      } catch {
        continue;
      }
    }
  }

  return fullText;
};

export const streamChatCompletion = async (
  request: StreamRequest,
  onToken: (token: string) => void
): Promise<string> => {
  if (!request.apiKey?.trim()) {
    throw new Error("Please add your API key in Settings");
  }

  const url = providerUrl(request.provider, request.baseUrl);
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: providerHeaders(request.provider, request.apiKey),
      body: JSON.stringify({
        model: request.model,
        messages: toPayloadMessages(request.messages, request.systemPrompt),
        stream: true,
        temperature: request.temperature ?? 0.7
      })
    });
  } catch {
    throw new Error(
      `Could not reach ${request.provider === "mimo" ? "MiMo" : "OpenRouter"} at ${url}. Check the provider base URL, DNS, CORS, and your internet connection.`
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Provider request failed with ${response.status}`);
  }

  return readStream(response, onToken);
};
