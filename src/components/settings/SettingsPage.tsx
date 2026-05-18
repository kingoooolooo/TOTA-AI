import { KeyRound, Mic, Palette, ScrollText, SlidersHorizontal, User, Database } from "lucide-react";
import { useState } from "react";
import { ModelSelector } from "../layout/ModelSelector";
import { ApiKeySection } from "./ApiKeySection";
import { AppearanceSection } from "./AppearanceSection";
import { DataSection } from "./DataSection";
import { SystemPromptSection } from "./SystemPromptSection";
import { VoiceSection } from "./VoiceSection";
import { useSettingsStore } from "../../stores/settingsStore";

type SettingsTab = "profile" | "api" | "models" | "prompt" | "voice" | "appearance" | "data";

const tabs = [
  { id: "profile" as const, label: "Profile", icon: User },
  { id: "api" as const, label: "API Keys", icon: KeyRound },
  { id: "models" as const, label: "Models", icon: SlidersHorizontal },
  { id: "prompt" as const, label: "System Prompt", icon: ScrollText },
  { id: "voice" as const, label: "Voice", icon: Mic },
  { id: "appearance" as const, label: "Appearance", icon: Palette },
  { id: "data" as const, label: "Data", icon: Database }
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { settings, updateSettings } = useSettingsStore();

  return (
    <section className="settings-page">
      <aside className="settings-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </aside>

      <div className="settings-content">
        {activeTab === "profile" ? (
          <section className="settings-section">
            <h2>Profile</h2>
            <div className="profile-preview">
              <span className="home-logo home-logo--small">
                <img src="/chat-bg.webp" alt="" style={{ transform: "rotate(-90deg)" }} />
              </span>
              <div>
                <strong>{settings.appName}</strong>
                <p>{settings.username}</p>
              </div>
            </div>
            <label className="field">
              <span>App Name</span>
              <input
                value={settings.appName}
                onChange={(event) => updateSettings({ appName: event.target.value || "Ayan AI" })}
              />
            </label>
            <label className="field">
              <span>Username</span>
              <input
                value={settings.username}
                onChange={(event) => updateSettings({ username: event.target.value || "Ayan" })}
              />
            </label>
          </section>
        ) : null}
        {activeTab === "api" ? <ApiKeySection /> : null}
        {activeTab === "models" ? (
          <section className="settings-section">
            <h2>Models</h2>
            <label className="field">
              <span>Default model</span>
              <ModelSelector />
            </label>
          </section>
        ) : null}
        {activeTab === "prompt" ? <SystemPromptSection /> : null}
        {activeTab === "voice" ? <VoiceSection /> : null}
        {activeTab === "appearance" ? <AppearanceSection /> : null}
        {activeTab === "data" ? <DataSection /> : null}
      </div>
    </section>
  );
};
