import type { ModelOption } from "../types";
import { getOpenRouterModelCache, saveOpenRouterModelCache } from "./storageService";

const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

export const openRouterMimoModels: ModelOption[] = [
  {
    id: "xiaomi/mimo-v2.5-pro",
    name: "Xiaomi: MiMo-V2.5-Pro",
    provider: "openrouter",
    description: "MiMo-V2.5-Pro through OpenRouter"
  },
  {
    id: "xiaomi/mimo-v2.5",
    name: "Xiaomi: MiMo-V2.5",
    provider: "openrouter",
    description: "MiMo-V2.5 through OpenRouter"
  },
  {
    id: "xiaomi/mimo-v2-flash",
    name: "Xiaomi: MiMo-V2-Flash",
    provider: "openrouter",
    description: "MiMo-V2-Flash through OpenRouter"
  },
  {
    id: "xiaomi/mimo-v2-pro",
    name: "Xiaomi: MiMo-V2-Pro",
    provider: "openrouter",
    description: "MiMo-V2-Pro through OpenRouter"
  },
  {
    id: "xiaomi/mimo-v2-omni",
    name: "Xiaomi: MiMo-V2-Omni",
    provider: "openrouter",
    description: "MiMo-V2-Omni through OpenRouter"
  }
];

interface OpenRouterModelResponse {
  data?: Array<{
    id: string;
    name?: string;
    description?: string;
  }>;
}

export const getCachedOpenRouterModels = (): ModelOption[] => {
  const cached = getOpenRouterModelCache();
  if (!cached) return [];

  const age = Date.now() - new Date(cached.fetchedAt).getTime();
  return age < CACHE_TTL_MS ? cached.models : [];
};

export const fetchOpenRouterModels = async (apiKey: string): Promise<ModelOption[]> => {
  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`
          }
        : undefined
    });
  } catch {
    throw new Error("Could not reach OpenRouter. Check your internet connection or browser network blocking.");
  }

  if (!response.ok) {
    throw new Error(`Could not load OpenRouter models (${response.status})`);
  }

  const json = (await response.json()) as OpenRouterModelResponse;
  const fetchedModels =
    json.data?.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      provider: "openrouter" as const,
      description: model.description
    })) ?? [];
  const fetchedIds = new Set(fetchedModels.map((model) => model.id));
  const models = [
    ...openRouterMimoModels.filter((model) => !fetchedIds.has(model.id)),
    ...fetchedModels
  ];

  saveOpenRouterModelCache(models);
  return models;
};

export const testOpenRouterKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey?.trim()) return false;
  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  } catch {
    throw new Error("Could not reach OpenRouter. Check your internet connection or browser network blocking.");
  }
  return response.ok;
};
