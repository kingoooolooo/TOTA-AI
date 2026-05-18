import { useSettingsStore } from "../../stores/settingsStore";

export const VoiceSection = () => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <section className="settings-section">
      <h2>Voice</h2>
      <label className="toggle-row">
        <span>
          <strong>Read AI responses aloud automatically</strong>
          <small>Off by default; uses MiMo TTS when enabled.</small>
        </span>
        <input
          type="checkbox"
          checked={settings.autoTTS}
          onChange={(event) => updateSettings({ autoTTS: event.target.checked })}
        />
      </label>

      <label className="field">
        <span>ASR Language</span>
        <select
          value={settings.asrLanguage}
          onChange={(event) => updateSettings({ asrLanguage: event.target.value })}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="auto">Auto detect</option>
        </select>
      </label>

      <label className="field">
        <span>Max Recording Duration: {settings.maxRecordingDuration}s</span>
        <input
          type="range"
          min={10}
          max={120}
          step={5}
          value={settings.maxRecordingDuration}
          onChange={(event) => updateSettings({ maxRecordingDuration: Number(event.target.value) })}
        />
      </label>

      <label className="field">
        <span>TTS Voice</span>
        <input
          value={settings.ttsVoice}
          onChange={(event) => updateSettings({ ttsVoice: event.target.value })}
          placeholder="default"
        />
      </label>
    </section>
  );
};
