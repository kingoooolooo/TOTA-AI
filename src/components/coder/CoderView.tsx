import { Download, FilePlus2, MessageSquareText, Play, TerminalSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useChat } from "../../hooks/useChat";
import { useSettingsStore } from "../../stores/settingsStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useUiStore } from "../../stores/uiStore";
import type { Attachment } from "../../types";
import { downloadFilesAsZip } from "../../utils/zipHandler";
import { InputBar } from "../chat/InputBar";
import { CodeEditor } from "./CodeEditor";
import { ConsolePanel } from "./ConsolePanel";
import { FileTree } from "./FileTree";
import { PreviewPanel } from "./PreviewPanel";

export const CoderView = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { settings } = useSettingsStore();
  const sessions = useSessionStore((state) => state.sessions);
  const selectSession = useSessionStore((state) => state.selectSession);
  const createSession = useSessionStore((state) => state.createSession);
  const deleteEmptySessions = useSessionStore((state) => state.deleteEmptySessions);
  const streaming = useUiStore((state) => state.streaming);
  const { sendMessage } = useChat();
  const session = sessions.find((item) => item.id === sessionId && item.type === "coder") ?? null;
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const selectedFile = session?.files.find((file) => file.path === selectedPath) ?? session?.files[0] ?? null;

  useEffect(() => {
    if (sessionId) selectSession(sessionId);
  }, [selectSession, sessionId]);

  useEffect(() => {
    if (!selectedPath && session?.files[0]) {
      setSelectedPath(session.files[0].path);
    }
  }, [selectedPath, session?.files]);

  const submit = async (content: string, attachments: Attachment[]): Promise<void> => {
    const targetSession =
      session ??
      createSession({
        type: "coder",
        model: settings.defaultModel,
        provider: settings.defaultProvider
      });

    if (!session) navigate(`/coder/${targetSession.id}`);
    setConsoleLines([]);
    await sendMessage({ sessionId: targetSession.id, content, attachments, type: "coder" });
  };

  const newProject = (): void => {
    deleteEmptySessions();
    setSelectedPath(null);
    navigate("/coder");
  };

  const downloadZip = async (): Promise<void> => {
    if (!session || session.files.length === 0) {
      toast.error("No project files to download");
      return;
    }
    await downloadFilesAsZip(session.files, session.title);
  };

  const appendConsole = useCallback((line: string) => {
    setConsoleLines((current) => [...current.slice(-300), line]);
  }, []);

  const recentAgentMessages = useMemo(
    () => session?.messages.slice(-6).filter((message) => message.content.trim()) ?? [],
    [session?.messages]
  );

  return (
    <section className="coder-view">
      <div className="coder-toolbar">
        <div>
          <strong>{session?.title ?? "New Project"}</strong>
          <span>{session?.files.length ?? 0} files</span>
        </div>
        <div className="coder-toolbar__actions">
          <button type="button" className="secondary-button" onClick={newProject}>
            <FilePlus2 size={16} />
            New Project
          </button>
          <button type="button" className="secondary-button" onClick={() => void downloadZip()}>
            <Download size={16} />
            Download ZIP
          </button>
        </div>
      </div>

      <div className="coder-workspace">
        <aside className="coder-files">
          <FileTree files={session?.files ?? []} selectedPath={selectedFile?.path ?? null} onSelect={setSelectedPath} />
        </aside>
        <div className="coder-editor">
          <div className="panel-title">{selectedFile?.path ?? "Editor"}</div>
          <CodeEditor file={selectedFile} theme={settings.theme} />
        </div>
        <aside className="coder-preview">
          <div className="preview-tabs">
            <button
              type="button"
              className={activeTab === "preview" ? "active" : ""}
              onClick={() => setActiveTab("preview")}
            >
              <Play size={15} />
              Preview
            </button>
            <button
              type="button"
              className={activeTab === "console" ? "active" : ""}
              onClick={() => setActiveTab("console")}
            >
              <TerminalSquare size={15} />
              Console
            </button>
          </div>
          <div className="preview-body">
            {activeTab === "preview" ? (
              <PreviewPanel files={session?.files ?? []} onConsole={appendConsole} />
            ) : (
              <ConsolePanel lines={consoleLines} />
            )}
          </div>
          <div className="coder-chat-strip">
            <MessageSquareText size={15} />
            <div>
              {recentAgentMessages.length === 0 ? (
                <span>No agent messages yet</span>
              ) : (
                recentAgentMessages.map((message) => <p key={message.id}>{message.content.slice(0, 180)}</p>)
              )}
            </div>
          </div>
        </aside>
      </div>

      <InputBar placeholder="Describe what you want to build..." disabled={streaming} onSubmit={submit} />
    </section>
  );
};
