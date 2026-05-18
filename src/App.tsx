import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "./router";
import { useSettingsStore } from "./stores/settingsStore";

const resolveTheme = (theme: "dark" | "light" | "system"): "dark" | "light" => {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export const App = () => {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolveTheme(settings.theme);
    root.dataset.fontSize = settings.fontSize;
    root.style.setProperty("--accent", settings.accentColor);
  }, [settings.accentColor, settings.fontSize, settings.theme]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
};
