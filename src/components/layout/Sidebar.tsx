import {
  Code2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSettingsStore } from "../../stores/settingsStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useUiStore } from "../../stores/uiStore";
import { formatRelativeTime } from "../../utils/timeUtils";
import { SidebarBackground } from "./SidebarBackground";

export const Sidebar = () => {
  const navigate = useNavigate();
  const sessions = useSessionStore((state) => state.sessions);
  const deleteSession = useSessionStore((state) => state.deleteSession);
  const renameSession = useSessionStore((state) => state.renameSession);
  const deleteEmptySessions = useSessionStore((state) => state.deleteEmptySessions);
  const { settings } = useSettingsStore();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const historyExpanded = useUiStore((state) => state.historyExpanded);
  const setHistoryExpanded = useUiStore((state) => state.setHistoryExpanded);
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const filteredSessions = useMemo(
    () => sessions.filter((session) => session.title.toLowerCase().includes(query.toLowerCase())),
    [query, sessions]
  );

  const visibleSessions = historyExpanded ? filteredSessions : filteredSessions.slice(0, 8);

  const beginRename = (sessionId: string, title: string): void => {
    setRenamingId(sessionId);
    setDraftTitle(title);
  };

  const commitRename = (): void => {
    if (!renamingId) return;
    renameSession(renamingId, draftTitle);
    setRenamingId(null);
    setDraftTitle("");
  };

  const removeSession = (sessionId: string): void => {
    deleteSession(sessionId);
    toast.success("Session deleted");
  };

  const goNewChat = (): void => {
    deleteEmptySessions();
    const isCoder = window.location.pathname.startsWith("/coder");
    navigate(isCoder ? "/coder" : "/chat");
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "" : "sidebar--closed"}`}>
      <SidebarBackground />
      <div className="sidebar__brand">
        <button className="brand-mark" type="button" onClick={() => navigate("/")}>
          <img src="/chat-bg.webp" alt="Ayan AI" style={{ transform: "rotate(-90deg)" }} />
        </button>
        <div className="sidebar__brand-text">
          <strong>{settings.appName}</strong>
          <span>Personal AI workspace</span>
        </div>
        <button className="icon-button" type="button" onClick={goNewChat} aria-label="New chat">
          <Plus size={18} />
        </button>
      </div>

      <div className="sidebar__search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats..." />
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        <NavLink to="/chat" className={({ isActive }) => `sidebar__nav-item ${isActive ? "active" : ""}`}>
          <MessageSquare size={18} />
          <span>Chat</span>
        </NavLink>
        <NavLink to="/coder" className={({ isActive }) => `sidebar__nav-item ${isActive ? "active" : ""}`}>
          <Code2 size={18} />
          <span>Coder</span>
        </NavLink>
      </nav>

      <section className="sidebar__history">
        <div className="sidebar__section-title">History</div>
        {sessions.length === 0 ? (
          <p className="sidebar__empty">No sessions yet. Start a new chat!</p>
        ) : filteredSessions.length === 0 ? (
          <p className="sidebar__empty">No results found</p>
        ) : (
          <>
            <div className="history-list">
              {visibleSessions.map((session) => (
                <div key={session.id} className="history-item">
                  <button
                    type="button"
                    className="history-item__main"
                    onClick={() => navigate(`/${session.type}/${session.id}`)}
                    onDoubleClick={() => beginRename(session.id, session.title)}
                  >
                    {renamingId === session.id ? (
                      <input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitRename();
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="history-item__title">{session.title}</span>
                    )}
                    <span className="history-item__meta">
                      <span className={`type-badge type-badge--${session.type}`}>{session.type}</span>
                      {formatRelativeTime(session.updatedAt)}
                    </span>
                  </button>
                  <div className="history-item__actions">
                    <button
                      type="button"
                      aria-label="Rename session"
                      onClick={() => beginRename(session.id, session.title)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button type="button" aria-label="Delete session" onClick={() => removeSession(session.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredSessions.length > 8 ? (
              <button
                className="sidebar__show-more"
                type="button"
                onClick={() => setHistoryExpanded(!historyExpanded)}
              >
                {historyExpanded ? "Show less" : "Show more"}
              </button>
            ) : null}
          </>
        )}
      </section>

      <button className="sidebar__profile" type="button" onClick={() => navigate("/settings")}>
        <span className="avatar">{settings.username.slice(0, 1).toUpperCase() || "A"}</span>
        <span>{settings.username}</span>
        <Settings size={17} />
      </button>
    </aside>
  );
};
