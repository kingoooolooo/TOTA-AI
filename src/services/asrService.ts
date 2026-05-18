import { normalizeBaseUrl } from "../utils/urlUtils";

const DEFAULT_MIMO_BASE_URL = import.meta.env.VITE_MIMO_BASE_URL ?? "https://api.xiaomimimo.com/v1";

interface TranscriptionResponse {
  text?: string;
}

export const transcribeAudio = async (
  audioBlob: Blob,
  apiKey: string,
  language: string,
  baseUrl = DEFAULT_MIMO_BASE_URL
): Promise<string> => {
  if (!apiKey.trim()) {
    throw new Error("Please add your MiMo API key in Settings");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "whisper-1");
  formData.append("language", language);

  let response: Response;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  try {
    response = await fetch(`${normalizedBaseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });
  } catch {
    throw new Error(`Could not reach MiMo ASR at ${normalizedBaseUrl}. Check the MiMo base URL.`);
  }

  if (!response.ok) {
    throw new Error(`ASR failed with ${response.status}`);
  }

  const json = (await response.json()) as TranscriptionResponse;
  return json.text?.trim() ?? "";
};
