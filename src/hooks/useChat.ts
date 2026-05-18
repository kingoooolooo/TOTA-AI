import { useCallback } from "react";
import { toast } from "sonner";
import type { Attachment, SessionType } from "../types";
import { streamChatCompletion } from "../services/streamingService";
import { useSettingsStore } from "../stores/settingsStore";
import { makeMessage, useSessionStore } from "../stores/sessionStore";
import { useUiStore } from "../stores/uiStore";
import { attachmentsToPromptContext } from "../utils/fileParser";
import { buildCoderSystemPrompt, parseCoderFiles } from "../utils/coderParser";
import { directMimoToOpenRouterModel } from "../utils/modelUtils";

interface SendMessageInput {
  sessionId: string;
  content: string;
  attachments: Attachment[];
  type: SessionType;
}

interface UseChatResult {
  sendMessage: (input: SendMessageInput) => Promise<void>;
}

const composeUserContent = (content: string, attachments: Attachment[]): string => {
  const context = attachmentsToPromptContext(attachments);
  return [content.trim(), context].filter(Boolean).join("\n\n");
};

export const useChat = (): UseChatResult => {
  const { settings } = useSettingsStore();
  const setStreaming = useUiStore((state) => state.setStreaming);

  const sendMessage = useCallback(
    async ({ sessionId, content, attachments, type }: SendMessageInput) => {
      const store = useSessionStore.getState();
      const session = store.sessions.find((item) => item.id === sessionId);
      if (!session) return;

      const provider = settings.defaultProvider;
      const model = settings.defaultModel;
      const apiKey = provider === "mimo" ? settings.mimoApiKey : settings.openRouterApiKey;
      const displayMessage = makeMessage("user", content.trim(), attachments);
      const apiMessage = {
        ...displayMessage,
        content: composeUserContent(content, attachments)
      };
      const assistantMessage = makeMessage("assistant", "");
      const messagesForApi = [...session.messages, apiMessage];
      const systemPrompt =
        type === "coder" ? buildCoderSystemPrompt(settings.systemPrompt) : settings.systemPrompt;

      store.appendMessage(sessionId, displayMessage);
      store.appendMessage(sessionId, assistantMessage);
      setStreaming(true);

      try {
        let fullText = "";
        const streamRequest = async (
          requestProvider: typeof provider,
          requestModel: string,
          requestApiKey: string
        ): Promise<void> => {
          await streamChatCompletion(
            {
              provider: requestProvider,
              model: requestModel,
              apiKey: requestApiKey,
              baseUrl: requestProvider === "mimo" ? settings.mimoBaseUrl : undefined,
              systemPrompt,
              messages: messagesForApi
            },
            (token) => {
              fullText += token;
              useSessionStore.getState().updateMessageContent(sessionId, assistantMessage.id, fullText);
            }
          );
        };

        try {
          await streamRequest(provider, model, apiKey);
        } catch (err) {
          const fallbackModel = provider === "mimo" ? directMimoToOpenRouterModel(model) : null;
          if (!fallbackModel || !settings.openRouterApiKey?.trim()) {
            throw err;
          }

          toast.message("Direct MiMo is unreachable, using MiMo through OpenRouter");
          fullText = "";
          useSessionStore.getState().updateMessageContent(sessionId, assistantMessage.id, "");
          await streamRequest("openrouter", fallbackModel, settings.openRouterApiKey);
        }

        if (type === "coder") {
          try {
            const files = parseCoderFiles(fullText);
            useSessionStore.getState().setCoderFiles(sessionId, files);
            toast.success(`Generated ${files.length} files`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "AI returned invalid code format");
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        useSessionStore.getState().updateMessageContent(sessionId, assistantMessage.id, `Error: ${message}`);
        toast.error(message);
      } finally {
        setStreaming(false);
      }
    },
    [
      setStreaming,
      settings.defaultModel,
      settings.defaultProvider,
      settings.mimoBaseUrl,
      settings.mimoApiKey,
      settings.openRouterApiKey,
      settings.systemPrompt
    ]
  );

  return { sendMessage };
};
