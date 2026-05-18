import { Check, Copy, Pause, ThumbsDown, ThumbsUp, Volume2 } from "lucide-react";
import React, { ReactNode, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useVoice } from "../../hooks/useVoice";
import { useSessionStore } from "../../stores/sessionStore";
import type { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  sessionId: string;
}

const extractText = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children);
  return "";
};

const MarkdownContent = ({ content }: { content: string }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const components = useMemo(
    () => ({
      pre({ children }: { children?: ReactNode }) {
        const text = extractText(children);
        const languageMatch = text.match(/^([a-z0-9-]+)\n/i);
        const language = languageMatch?.[1] ?? "code";
        return (
          <div className="code-frame">
            <div className="code-frame__bar">
              <span>{language}</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(text);
                  setCopiedCode(text);
                  window.setTimeout(() => setCopiedCode(null), 1200);
                }}
              >
                {copiedCode === text ? <Check size={14} /> : <Copy size={14} />}
                Copy
              </button>
            </div>
            <pre>{children}</pre>
          </div>
        );
      }
    }),
    [copiedCode]
  );

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
      {content}
    </ReactMarkdown>
  );
};

export const MessageBubble = ({ message, sessionId }: MessageBubbleProps) => {
  const updateFeedback = useSessionStore((state) => state.updateMessageFeedback);
  const { speak, stopSpeaking, speakingMessageId } = useVoice();
  const isAssistant = message.role === "assistant";
  const isSpeaking = speakingMessageId === message.id;

  const copyMessage = (): void => {
    void navigator.clipboard.writeText(message.content);
    toast.success("Copied!");
  };

  return (
    <article className={`message message--${message.role}`}>
      <div className="message__avatar">{isAssistant ? "AI" : "A"}</div>
      <div className="message__body">
        <div className="message__content">
          {message.content ? <MarkdownContent content={message.content} /> : <span className="typing-dots">...</span>}
          {message.attachments.length > 0 ? (
            <div className="message__attachments">
              {message.attachments.map((attachment) => (
                <span key={attachment.id}>{attachment.filename}</span>
              ))}
            </div>
          ) : null}
        </div>
        {isAssistant ? (
          <div className="message__actions">
            <button type="button" onClick={copyMessage} aria-label="Copy message">
              <Copy size={15} />
            </button>
            <button
              type="button"
              onClick={() => (isSpeaking ? stopSpeaking() : void speak(message.id, message.content))}
              aria-label={isSpeaking ? "Stop speech" : "Speak response"}
            >
              {isSpeaking ? <Pause size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              type="button"
              onClick={() => updateFeedback(sessionId, message.id, "thumbs_up")}
              aria-label="Thumbs up"
              className={message.feedback === "thumbs_up" ? "active" : ""}
            >
              <ThumbsUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => updateFeedback(sessionId, message.id, "thumbs_down")}
              aria-label="Thumbs down"
              className={message.feedback === "thumbs_down" ? "active" : ""}
            >
              <ThumbsDown size={15} />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
};
