import { useSettingsStore } from "../../stores/settingsStore";
import type { FontSize, ThemePreference } from "../../types";

const themes: ThemePreference[] = ["dark", "light", "system"];
const fontSizes: FontSize[] = ["small", "medium", "large"];

export const AppearanceSection = () => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <section className="settings-section">
      <h2>Appearance</h2>
      <label className="field">
        <span>Theme</span>
        <div className="segmented">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              className={settings.theme === theme ? "active" : ""}
              onClick={() => updateSettings({ theme })}
            >
              {theme}
            </button>
          ))}
        </div>
      </label>

      <label className="field">
        <span>Accent Color</span>
        <input
          className="color-input"
          type="color"
          value={settings.accentColor}
          onChange={(event) => updateSettings({ accentColor: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Font Size</span>
        <div className="segmented">
          {fontSizes.map((fontSize) => (
            <button
              key={fontSize}
              type="button"
              className={settings.fontSize === fontSize ? "active" : ""}
              onClick={() => updateSettings({ fontSize })}
            >
              {fontSize}
            </button>
          ))}
        </div>
      </label>
    </section>
  );
};
