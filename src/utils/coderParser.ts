import type { CoderFile, CoderJsonResponse } from "../types";
import { getLanguageFromPath } from "./languageUtils";

const coderSystemInstructions = `
You are the Ayan AI coding agent.
Return only valid JSON with this exact shape:
{
  "files": {
    "package.json": "complete file content",
    "src/App.tsx": "complete file content"
  },
  "notes": "short summary"
}
Always output complete file contents. Never truncate code. Include package.json for Node projects.
`;

export const buildCoderSystemPrompt = (customPrompt: string): string =>
  [customPrompt.trim(), coderSystemInstructions.trim()].filter(Boolean).join("\n\n");

const stripCodeFence = (content: string): string => {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenceMatch?.[1]?.trim() ?? trimmed;
};

const extractJsonObject = (content: string): string => {
  const stripped = stripCodeFence(content);
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < firstBrace) return stripped;
  return stripped.slice(firstBrace, lastBrace + 1);
};

export const parseCoderFiles = (content: string): CoderFile[] => {
  const jsonText = extractJsonObject(content);
  const parsed = JSON.parse(jsonText) as CoderJsonResponse;

  if (!parsed.files || Object.keys(parsed.files).length === 0) {
    throw new Error("AI did not generate any files. Try rephrasing your request.");
  }

  return Object.entries(parsed.files).map(([path, fileContent]) => ({
    path,
    content: fileContent,
    language: getLanguageFromPath(path)
  }));
};
