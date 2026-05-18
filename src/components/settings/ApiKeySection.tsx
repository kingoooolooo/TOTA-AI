import { Eye, EyeOff, PlugZap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { testMimoKey } from "../../services/mimoClient";
import { testOpenRouterKey } from "../../services/openRouterClient";
import { useSettingsStore } from "../../stores/settingsStore";

export const ApiKeySection = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [showMimo, setShowMimo] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [testing, setTesting] = useState<"mimo" | "openrouter" | null>(null);

  const testKey = async (provider: "mimo" | "openrouter"): Promise<void> => {
    setTesting(provider);
    try {
      const ok =
        provider === "mimo"
          ? await testMimoKey(settings.mimoApiKey, settings.mimoBaseUrl)
          : await testOpenRouterKey(settings.openRouterApiKey);
      if (ok && provider === "mimo") {
        updateSettings({
          defaultProvider: "mimo",
          defaultModel: "mimo-v2.5-pro",
          mimoBaseUrl: settings.mimoBaseUrl
        });
      }
      toast[ok ? "success" : "error"](ok ? "Connection works" : "Connection failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setTesting(null);
    }
  };

  return (
    <section className="settings-section">
      <h2>API Keys</h2>
      <label className="field">
        <span>MiMo Base URL</span>
        <input
          value={settings.mimoBaseUrl}
          onChange={(event) => updateSettings({ mimoBaseUrl: event.target.value })}
          placeholder="https://api.xiaomimimo.com/v1"
          aria-label="MiMo base URL"
        />
      </label>

      <label className="field">
        <span>MiMo API Key</span>
        <div className="password-row">
          <input
            type={showMimo ? "text" : "password"}
            value={settings.mimoApiKey}
            onChange={(event) => updateSettings({ mimoApiKey: event.target.value })}
            placeholder="mimo..."
          />
          <button type="button" onClick={() => setShowMimo((value) => !value)} aria-label="Show MiMo key">
            {showMimo ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button type="button" onClick={() => void testKey("mimo")} disabled={testing === "mimo"}>
            <PlugZap size={16} />
            {testing === "mimo" ? "Testing..." : "Test"}
          </button>
        </div>
      </label>

      <label className="field">
        <span>OpenRouter API Key</span>
        <div className="password-row">
          <input
            type={showOpenRouter ? "text" : "password"}
            value={settings.openRouterApiKey}
            onChange={(event) => updateSettings({ openRouterApiKey: event.target.value })}
            placeholder="sk-or..."
          />
          <button type="button" onClick={() => setShowOpenRouter((value) => !value)} aria-label="Show OpenRouter key">
            {showOpenRouter ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button type="button" onClick={() => void testKey("openrouter")} disabled={testing === "openrouter"}>
            <PlugZap size={16} />
            {testing === "openrouter" ? "Testing..." : "Test"}
          </button>
        </div>
      </label>
    </section>
  );
};
