import type { Attachment } from "../types";
import { createId } from "./idGenerator";
import { extractZipAttachments } from "./zipHandler";

const textExtensions = new Set([
  "css",
  "html",
  "js",
  "json",
  "jsx",
  "md",
  "py",
  "ts",
  "tsx",
  "txt"
]);

const imageExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "avif"
]);

const MAX_TEXT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ZIP_FILE_SIZE = 25 * 1024 * 1024;
const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;

const extensionOf = (fileName: string): string => fileName.split(".").pop()?.toLowerCase() ?? "";

const validateFile = (file: File): void => {
  const extension = extensionOf(file.name);
  if (extension === "zip") {
    if (file.size > MAX_ZIP_FILE_SIZE) throw new Error(`${file.name} is larger than 25MB`);
    return;
  }
  if (imageExtensions.has(extension)) {
    if (file.size > MAX_IMAGE_FILE_SIZE) throw new Error(`${file.name} is larger than 20MB`);
    return;
  }
  if (!textExtensions.has(extension)) {
    throw new Error(`${file.name} is not a supported file type`);
  }
  if (file.size > MAX_TEXT_FILE_SIZE) {
    throw new Error(`${file.name} is larger than 10MB`);
  }
};

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

export const parseFiles = async (files: FileList | File[]): Promise<Attachment[]> => {
  const pickedFiles = Array.from(files);
  const attachments: Attachment[] = [];

  for (const file of pickedFiles) {
    validateFile(file);

    if (extensionOf(file.name) === "zip") {
      attachments.push(...(await extractZipAttachments(file)));
      continue;
    }

    if (imageExtensions.has(extensionOf(file.name))) {
      const dataUrl = await readAsDataUrl(file);
      attachments.push({
        id: createId(),
        filename: file.name,
        content: `[Image: ${file.name}]`,
        mimeType: file.type || "image/png",
        size: file.size,
        dataUrl
      });
      continue;
    }

    attachments.push({
      id: createId(),
      filename: file.name,
      content: await file.text(),
      mimeType: file.type || "text/plain",
      size: file.size
    });
  }

  return attachments;
};

export const attachmentsToPromptContext = (attachments: Attachment[]): string => {
  const textAttachments = attachments.filter((a) => !a.dataUrl);
  if (textAttachments.length === 0) return "";
  return textAttachments
    .map((attachment) => `[File: ${attachment.filename}]\n${attachment.content}\n[End of file]`)
    .join("\n\n");
};
