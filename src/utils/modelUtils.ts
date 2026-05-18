export const directMimoToOpenRouterModel = (model: string): string | null => {
  const normalized = model.trim();
  const map: Record<string, string> = {
    "mimo-v2.5-pro": "xiaomi/mimo-v2.5-pro",
    "mimo-v2.5": "xiaomi/mimo-v2.5",
    "mimo-v2-flash": "xiaomi/mimo-v2-flash",
    "mimo-v2-pro": "xiaomi/mimo-v2-pro",
    "mimo-v2-omni": "xiaomi/mimo-v2-omni",
    "MiMo-V2.5-Pro": "xiaomi/mimo-v2.5-pro",
    "MiMo-V2.5": "xiaomi/mimo-v2.5",
    "MiMo-V2-Flash": "xiaomi/mimo-v2-flash"
  };

  return map[normalized] ?? null;
};
