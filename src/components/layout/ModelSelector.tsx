import { Check, ChevronDown, RefreshCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useModels } from "../../hooks/useModels";
import { useSettingsStore } from "../../stores/settingsStore";
import type { ModelOption, Provider } from "../../types";

const providerLabel: Record<Provider, string> = {
  mimo: "MiMo Models",
  openrouter: "OpenRouter Models"
};

interface ModelSelectorProps {
  compact?: boolean;
}

export const ModelSelector = ({ compact = false }: ModelSelectorProps) => {
  const { settings, setActiveModel } = useSettingsStore();
  const { mimoModels, openRouterModels, loading, error, refreshOpenRouterModels } = useModels();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(
    () => [
      {
        provider: "mimo" as const,
        models: mimoModels
      },
      {
        provider: "openrouter" as const,
        models: openRouterModels
      }
    ],
    [mimoModels, openRouterModels]
  );

  const matchesQuery = (model: ModelOption): boolean =>
    `${model.name} ${model.id}`.toLowerCase().includes(query.toLowerCase());

  const chooseModel = (model: ModelOption): void => {
    setActiveModel(model.id, model.provider);
    setOpen(false);
  };

  return (
    <div className="model-selector">
      <button
        className={`model-selector__trigger ${compact ? "model-selector__trigger--compact" : ""}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Select AI model"
      >
        <span>{settings.defaultModel}</span>
        <ChevronDown size={16} />
      </button>

      {open ? (
        <div className="model-selector__panel">
          <div className="model-selector__search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search models..."
            />
            <button
              type="button"
              aria-label="Refresh OpenRouter models"
              onClick={() => void refreshOpenRouterModels()}
            >
              <RefreshCcw size={15} className={loading ? "spin" : ""} />
            </button>
          </div>
          {error ? <p className="model-selector__error">{error}</p> : null}
          {groups.map((group) => {
            const models = group.models.filter(matchesQuery).slice(0, group.provider === "openrouter" ? 500 : 10);
            return (
              <section key={group.provider} className="model-selector__group">
                <h3>{providerLabel[group.provider]}</h3>
                {models.length === 0 ? (
                  <p className="model-selector__empty">
                    {group.provider === "openrouter" ? "Add a key or refresh models" : "No models found"}
                  </p>
                ) : (
                  models.map((model) => {
                    const active =
                      model.id === settings.defaultModel && model.provider === settings.defaultProvider;
                    return (
                      <button
                        key={`${model.provider}-${model.id}`}
                        className="model-selector__item"
                        type="button"
                        title={model.disabled ? "Add API key in Settings to use this model" : model.description}
                        onClick={() => chooseModel(model)}
                      >
                        <span>
                          <strong>{model.name}</strong>
                          <small>{model.provider}</small>
                        </span>
                        {active ? <Check size={16} /> : null}
                      </button>
                    );
                  })
                )}
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
