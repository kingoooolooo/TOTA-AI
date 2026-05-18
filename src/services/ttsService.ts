import { normalizeBaseUrl } from "../utils/urlUtils";

const DEFAULT_MIMO_BASE_URL = import.meta.env.VITE_MIMO_BASE_URL ?? "https://api.xiaomimimo.com/v1";

export const synthesizeSpeech = async (
  text: string,
  apiKey: string,
  voice: string,
  baseUrl = DEFAULT_MIMO_BASE_URL
): Promise<string> => {
  if (!apiKey.trim()) {
    throw new Error("Please add your MiMo API key in Settings");
  }

  let response: Response;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  try {
    response = await fetch(`${normalizedBaseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text.slice(0, 4096),
        voice
      })
    });
  } catch {
    throw new Error(`Could not reach MiMo TTS at ${normalizedBaseUrl}. Check the MiMo base URL.`);
  }

  if (!response.ok) {
    throw new Error(`TTS failed with ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
