import type { ModelOption } from "../types";
import { normalizeBaseUrl } from "../utils/urlUtils";

const DEFAULT_MIMO_BASE_URL = import.meta.env.VITE_MIMO_BASE_URL ?? "https://api.xiaomimimo.com/v1";

const explainNetworkFailure = (baseUrl: string): Error =>
  new Error(
    `Could not reach MiMo at ${baseUrl}. Check the base URL from your MiMo dashboard; this usually means DNS, CORS, or an unavailable endpoint.`
  );

export const mimoChatModels: ModelOption[] = [
  {
    id: "mimo-v2.5-pro",
    name: "MiMo-V2.5-Pro",
    provider: "mimo",
    description: "Best MiMo model for complex chat and coding"
  },
  {
    id: "mimo-v2.5",
    name: "MiMo-V2.5",
    provider: "mimo",
    description: "Balanced MiMo model"
  },
  {
    id: "mimo-v2-flash",
    name: "MiMo-V2-Flash",
    provider: "mimo",
    description: "Fast MiMo model"
  }
];

export const testMimoKey = async (apiKey: string, baseUrl = DEFAULT_MIMO_BASE_URL): Promise<boolean> => {
  if (!apiKey?.trim()) return false;
  let response: Response;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  try {
    response = await fetch(`${normalizedBaseUrl}/models`, {
      headers: {
        "api-key": apiKey,
        Authorization: `Bearer ${apiKey}`
      }
    });
  } catch {
    throw explainNetworkFailure(normalizedBaseUrl);
  }

  return response.ok;
};
