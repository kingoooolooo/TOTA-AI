import { X } from "lucide-react";
import type { Attachment } from "../../types";

interface FileChipProps {
  attachment: Attachment;
  onRemove: (id: string) => void;
}

export const FileChip = ({ attachment, onRemove }: FileChipProps) => (
  <span className={`file-chip ${attachment.dataUrl ? "file-chip--image" : ""}`}>
    {attachment.dataUrl ? (
      <img
        src={attachment.dataUrl}
        alt={attachment.filename}
        className="file-chip__thumb"
      />
    ) : null}
    <span>{attachment.filename}</span>
    <button type="button" onClick={() => onRemove(attachment.id)} aria-label={`Remove ${attachment.filename}`}>
      <X size={13} />
    </button>
  </span>
);
