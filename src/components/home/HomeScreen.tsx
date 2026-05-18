import { useNavigate } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import { useSettingsStore } from "../../stores/settingsStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useUiStore } from "../../stores/uiStore";
import type { Attachment } from "../../types";
import { getGreeting } from "../../utils/timeUtils";
import { InputBar } from "../chat/InputBar";
import { SuggestionCards } from "../chat/SuggestionCards";

export const HomeScreen = () => {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const createSession = useSessionStore((state) => state.createSession);
  const streaming = useUiStore((state) => state.streaming);
  const { sendMessage } = useChat();

  const startChat = async (content: string, attachments: Attachment[] = []): Promise<void> => {
    const session = createSession({
      type: "chat",
      model: settings.defaultModel,
      provider: settings.defaultProvider
    });
    navigate(`/chat/${session.id}`);
    await sendMessage({ sessionId: session.id, content, attachments, type: "chat" });
  };

  return (
    <section className="home-screen" style={{ position: "relative", overflow: "hidden" }}>
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
      <div className="home-screen__center">
        <div className="home-logo">
          <img src="/chat-bg.webp" alt="" style={{ transform: "rotate(-90deg)" }} />
        </div>
        <h2>
          {getGreeting()}, <span>{settings.username}</span>
        </h2>
        <p>How can I help you today?</p>
        <SuggestionCards onSelect={(prompt) => void startChat(prompt)} />
      </div>
      <div className="home-screen__input">
        <InputBar placeholder="Ask anything..." disabled={streaming} onSubmit={startChat} />
      </div>
    </section>
  );
};
