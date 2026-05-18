import { Globe2, Mic, Paperclip, Send, Square, X } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { useVoice } from "../../hooks/useVoice";
import { webSearch } from "../../services/webSearchService";
import type { Attachment } from "../../types";
import { parseFiles } from "../../utils/fileParser";
import { FileChip } from "./FileChip";

interface InputBarProps {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (content: string, attachments: Attachment[]) => Promise<void> | void;
}

export const InputBar = ({ placeholder, disabled = false, onSubmit }: InputBarProps) => {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [webSearchOn, setWebSearchOn] = useState(false);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { recording, startRecording, stopRecording } = useVoice((text) =>
    setValue((current) => [current, text].filter(Boolean).join(current ? " " : ""))
  );

  const canSubmit = Boolean(value.trim() || attachments.length > 0) && !disabled && !searching;

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (!files) return;

    try {
      const parsed = await parseFiles(files);
      setAttachments((current) => [...current, ...parsed]);
      toast.success(`${parsed.length} file${parsed.length === 1 ? "" : "s"} attached`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
    } finally {
      event.target.value = "";
    }
  };

  const submit = async (event?: FormEvent): Promise<void> => {
    event?.preventDefault();
    if (!canSubmit) return;

    let content = value;
    const nextAttachments = attachments;
    setValue("");
    setAttachments([]);

    // Inject web search results as context prefix
    if (webSearchOn && content.trim()) {
      setSearching(true);
      try {
        const results = await webSearch(content.trim());
        content = `${results}\n\nUser question: ${content}`;
        toast.success("Web search results injected");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Web search failed");
      } finally {
        setSearching(false);
      }
    }

    await onSubmit(content, nextAttachments);
  };

  return (
    <form className="input-bar" onSubmit={(event) => void submit(event)}>
      {attachments.length > 0 ? (
        <div className="input-bar__files">
          {attachments.map((attachment) => (
            <FileChip
              key={attachment.id}
              attachment={attachment}
              onRemove={(id) => setAttachments((current) => current.filter((item) => item.id !== id))}
            />
          ))}
        </div>
      ) : null}

      {webSearchOn ? (
        <div className="input-bar__web-badge">
          <Globe2 size={13} />
          Web search active — results will be fetched before sending
        </div>
      ) : null}

      <div className="input-bar__surface">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept=".js,.ts,.jsx,.tsx,.py,.html,.css,.json,.txt,.md,.zip,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico,.avif"
          onChange={(event) => void handleFiles(event)}
        />
        <button
          className="icon-button"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
        >
          <Paperclip size={18} />
        </button>
        <button
          className={`icon-button ${webSearchOn ? "icon-button--active" : ""}`}
          type="button"
          title={webSearchOn ? "Web search ON — click to disable" : "Enable web search"}
          aria-label="Toggle web search"
          onClick={() => {
            setWebSearchOn((prev) => !prev);
            toast.info(webSearchOn ? "Web search disabled" : "Web search enabled — DuckDuckGo results will be injected");
          }}
        >
          <Globe2 size={18} />
        </button>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={searching ? "Searching the web…" : placeholder}
          rows={1}
        />
        {value ? (
          <button className="icon-button" type="button" onClick={() => setValue("")} aria-label="Clear input">
            <X size={16} />
          </button>
        ) : null}
        <button
          className={`icon-button ${recording ? "recording" : ""}`}
          type="button"
          onClick={() => (recording ? stopRecording() : void startRecording())}
          aria-label={recording ? "Stop recording" : "Start voice input"}
        >
          {recording ? <Square size={16} /> : <Mic size={18} />}
        </button>
        <button className="send-button" type="submit" disabled={!canSubmit} aria-label="Send message">
          {searching ? <span className="spin" style={{ display: "inline-block" }}>⟳</span> : <Send size={18} />}
        </button>
      </div>
    </form>
  );
};
