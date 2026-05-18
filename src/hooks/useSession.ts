import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";
import type { Session } from "../types";

export const useActiveSession = (): Session | null => {
  const { sessionId } = useParams();
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const sessions = useSessionStore((state) => state.sessions);

  return useMemo(
    () => sessions.find((session) => session.id === (sessionId ?? activeSessionId)) ?? null,
    [activeSessionId, sessionId, sessions]
  );
};
