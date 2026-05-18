import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModelOption } from "../types";
import {
  fetchOpenRouterModels,
  getCachedOpenRouterModels,
  openRouterMimoModels
} from "../services/openRouterClient";
import { mimoChatModels } from "../services/mimoClient";
import { useSettingsStore } from "../stores/settingsStore";

interface UseModelsResult {
  models: ModelOption[];
  mimoModels: ModelOption[];
  openRouterModels: ModelOption[];
  loading: boolean;
  error: string | null;
  refreshOpenRouterModels: () => Promise<void>;
}

export const useModels = (): UseModelsResult => {
  const { settings } = useSettingsStore();
  const [openRouterModels, setOpenRouterModels] = useState<ModelOption[]>(() => {
    const cachedModels = getCachedOpenRouterModels();
    if (cachedModels.length === 0) return openRouterMimoModels;
    const cachedIds = new Set(cachedModels.map((model) => model.id));
    return [...openRouterMimoModels.filter((model) => !cachedIds.has(model.id)), ...cachedModels];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOpenRouterModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOpenRouterModels(await fetchOpenRouterModels(settings.openRouterApiKey));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load models");
    } finally {
      setLoading(false);
    }
  }, [settings.openRouterApiKey]);

  useEffect(() => {
    if (openRouterModels.length <= openRouterMimoModels.length) {
      void refreshOpenRouterModels();
    }
  }, [openRouterModels.length, refreshOpenRouterModels]);

  const disabledMimoModels = useMemo(
    () => mimoChatModels.map((model) => ({ ...model, disabled: !settings.mimoApiKey?.trim() })),
    [settings.mimoApiKey]
  );

  const disabledOpenRouterModels = useMemo(
    () => openRouterModels.map((model) => ({ ...model, disabled: !settings.openRouterApiKey?.trim() })),
    [openRouterModels, settings.openRouterApiKey]
  );

  return {
    models: [...disabledMimoModels, ...disabledOpenRouterModels],
    mimoModels: disabledMimoModels,
    openRouterModels: disabledOpenRouterModels,
    loading,
    error,
    refreshOpenRouterModels
  };
};
