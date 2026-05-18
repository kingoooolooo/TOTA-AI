import { useSettingsStore } from "../../stores/settingsStore";

export const SystemPromptSection = () => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <section className="settings-section">
      <h2>System Prompt</h2>
      <label className="field">
        <span>Custom system prompt</span>
        <textarea
          value={settings.systemPrompt}
          onChange={(event) => updateSettings({ systemPrompt: event.target.value })}
          placeholder="Leave empty for no restrictions"
          rows={10}
        />
      </label>
      <button className="secondary-button" type="button" onClick={() => updateSettings({ systemPrompt: "" })}>
        Clear
      </button>
    </section>
  );
};
