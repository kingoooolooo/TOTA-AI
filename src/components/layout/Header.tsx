import { Menu, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUiStore } from "../../stores/uiStore";
import { ModelSelector } from "./ModelSelector";

const routeTitle = (pathname: string): string => {
  if (pathname.startsWith("/coder")) return "Coder";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Chat";
};

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button className="icon-button app-header__menu" type="button" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <h1>{routeTitle(location.pathname)}</h1>
      </div>
      <div className="app-header__actions">
        <ModelSelector />
        <button className="icon-button" type="button" onClick={() => navigate("/settings")} aria-label="Open settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
