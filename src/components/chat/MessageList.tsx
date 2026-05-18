import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  sessionId: string;
  messages: Message[];
}

export const MessageList = ({ sessionId, messages }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} sessionId={sessionId} />
      ))}
      <div ref={endRef} />
    </div>
  );
};
