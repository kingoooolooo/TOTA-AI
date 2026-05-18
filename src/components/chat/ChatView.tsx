import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import { useSettingsStore } from "../../stores/settingsStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useUiStore } from "../../stores/uiStore";
import type { Attachment } from "../../types";
import { HomeScreen } from "../home/HomeScreen";
import { InputBar } from "./InputBar";
import { MessageList } from "./MessageList";

export const ChatView = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { settings } = useSettingsStore();
  const sessions = useSessionStore((state) => state.sessions);
  const selectSession = useSessionStore((state) => state.selectSession);
  const createSession = useSessionStore((state) => state.createSession);
  const streaming = useUiStore((state) => state.streaming);
  const { sendMessage } = useChat();
  const session = sessions.find((item) => item.id === sessionId && item.type === "chat") ?? null;

  useEffect(() => {
    if (sessionId) selectSession(sessionId);
  }, [selectSession, sessionId]);

  const submit = async (content: string, attachments: Attachment[]): Promise<void> => {
    let targetSession = session;
    if (!targetSession) {
      targetSession = createSession({
        type: "chat",
        model: settings.defaultModel,
        provider: settings.defaultProvider
      });
      navigate(`/chat/${targetSession.id}`);
    }
    await sendMessage({ sessionId: targetSession.id, content, attachments, type: "chat" });
  };

  // Show home screen only when there is truly no session at all
  if (!session) {
    return <HomeScreen />;
  }

  return (
    <section className="chat-view" style={{ position: "relative", overflow: "hidden" }}>
      <img 
        src="/chat-bg.webp" 
        alt="background" 
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          minWidth: "150%",
          minHeight: "150%",
          objectFit: "cover",
          transform: "translate(-50%, -50%) rotate(-90deg)",
          zIndex: -1,
          opacity: 0.2
        }} 
      />
      <MessageList sessionId={session.id} messages={session.messages} />
      <InputBar placeholder="Message Ayan AI..." disabled={streaming} onSubmit={submit} />
    </section>
  );
};
