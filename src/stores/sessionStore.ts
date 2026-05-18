import { create } from "zustand";
import type { Attachment, CoderFile, Feedback, Message, Provider, Session, SessionType } from "../types";
import { createId } from "../utils/idGenerator";
import { makeSessionTitle } from "../utils/timeUtils";
import { getSessions, saveSessions } from "../services/storageService";

interface CreateSessionInput {
  type: SessionType;
  model: string;
  provider: Provider;
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  createSession: (input: CreateSessionInput) => Session;
  selectSession: (sessionId: string) => void;
  appendMessage: (sessionId: string, message: Message) => void;
  updateMessageContent: (sessionId: string, messageId: string, content: string) => void;
  appendMessageToken: (sessionId: string, messageId: string, token: string) => void;
  updateMessageFeedback: (sessionId: string, messageId: string, feedback: Feedback) => void;
  setCoderFiles: (sessionId: string, files: CoderFile[]) => void;
  updateCoderFile: (sessionId: string, filePath: string, content: string) => void;
  renameSession: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  clearSessions: () => void;
  deleteEmptySessions: () => void;
}

const sortSessions = (sessions: Session[]): Session[] =>
  [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const persist = (sessions: Session[]): Session[] => {
  const filtered = sessions.filter((session) => session.messages.length > 0 || session.files.length > 0);
  const sorted = sortSessions(filtered);
  saveSessions(sorted);
  return sorted;
};

const createMessageTitle = (session: Session, message: Message): string => {
  if (session.messages.some((item) => item.role === "user")) return session.title;
  if (message.role !== "user") return session.title;
  return makeSessionTitle(message.content, `${session.type === "chat" ? "New Chat" : "New Project"} ${new Date().toLocaleString()}`);
};

export const makeMessage = (
  role: Message["role"],
  content: string,
  attachments: Attachment[] = []
): Message => ({
  id: createId(),
  role,
  content,
  timestamp: new Date().toISOString(),
  attachments,
  feedback: null,
  audioUrl: null
});

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: sortSessions(getSessions()),
  activeSessionId: null,
  createSession: ({ type, model, provider }) => {
    const now = new Date().toISOString();
    const session: Session = {
      id: createId(),
      type,
      title: type === "chat" ? "New Chat" : "New Project",
      createdAt: now,
      updatedAt: now,
      model,
      provider,
      messages: [],
      files: []
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id
    }));
    return session;
  },
  selectSession: (sessionId) => set({ activeSessionId: sessionId }),
  appendMessage: (sessionId, message) => {
    set((state) => {
      const nextSessions = state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: createMessageTitle(session, message),
              updatedAt: new Date().toISOString(),
              messages: [...session.messages, message]
            }
          : session
      );
      return { sessions: persist(nextSessions) };
    });
  },
  updateMessageContent: (sessionId, messageId, content) => {
    set((state) => {
      const nextSessions = state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              updatedAt: new Date().toISOString(),
              messages: session.messages.map((message) =>
                message.id === messageId ? { ...message, content } : message
              )
            }
          : session
      );
      return { sessions: persist(nextSessions) };
    });
  },
  appendMessageToken: (sessionId, messageId, token) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    const message = session?.messages.find((item) => item.id === messageId);
    if (!message) return;
    get().updateMessageContent(sessionId, messageId, `${message.content}${token}`);
  },
  updateMessageFeedback: (sessionId, messageId, feedback) => {
    set((state) => {
      const nextSessions = state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map((message) =>
                message.id === messageId ? { ...message, feedback } : message
              )
            }
          : session
      );
      return { sessions: persist(nextSessions) };
    });
  },
  setCoderFiles: (sessionId, files) => {
    set((state) => {
      const nextSessions = state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              updatedAt: new Date().toISOString(),
              files
            }
          : session
      );
      return { sessions: persist(nextSessions) };
    });
  },
  updateCoderFile: (sessionId, filePath, content) => {
    set((state) => {
      const nextSessions = state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              updatedAt: new Date().toISOString(),
              files: session.files.map((file) =>
                file.path === filePath ? { ...file, content } : file
              )
            }
          : session
      );
      return { sessions: persist(nextSessions) };
    });
  },
  renameSession: (sessionId, title) => {
    set((state) => {
      const nextSessions = state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: title.trim() || session.title,
              updatedAt: new Date().toISOString()
            }
          : session
      );
      return { sessions: persist(nextSessions) };
    });
  },
  deleteSession: (sessionId) => {
    set((state) => {
      const nextSessions = persist(state.sessions.filter((session) => session.id !== sessionId));
      return {
        sessions: nextSessions,
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
      };
    });
  },
  clearSessions: () => {
    saveSessions([]);
    set({ sessions: [], activeSessionId: null });
  },
  deleteEmptySessions: () => {
    set((state) => ({ sessions: persist(state.sessions) }));
  }
}));
