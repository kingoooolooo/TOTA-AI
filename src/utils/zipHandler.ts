import JSZip from "jszip";
import type { Attachment, CoderFile } from "../types";
import { createId } from "./idGenerator";

const MAX_ZIP_TEXT_FILES = 50;

const looksBinary = (content: string): boolean => content.includes("\u0000");

export const extractZipAttachments = async (file: File): Promise<Attachment[]> => {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir).slice(0, MAX_ZIP_TEXT_FILES);
  const attachments: Attachment[] = [];

  for (const entry of entries) {
    const content = await entry.async("string");
    if (looksBinary(content)) continue;

    attachments.push({
      id: createId(),
      filename: entry.name,
      content,
      mimeType: "text/plain",
      size: new Blob([content]).size
    });
  }

  return attachments;
};

export const downloadFilesAsZip = async (files: CoderFile[], title: string): Promise<void> => {
  const zip = new JSZip();
  files.forEach((file) => zip.file(file.path, file.content));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.replace(/[^\w-]+/g, "-").replace(/-+/g, "-").toLowerCase() || "project"}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
};
