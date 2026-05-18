import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearAllData, exportAllData } from "../../services/storageService";
import { useSessionStore } from "../../stores/sessionStore";

export const DataSection = () => {
  const clearSessions = useSessionStore((state) => state.clearSessions);

  const exportHistory = (): void => {
    const blob = new Blob([exportAllData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ayan-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("History exported");
  };

  const clearHistory = (): void => {
    const confirmation = window.prompt('Type "DELETE" to clear all local history');
    if (confirmation !== "DELETE") return;
    clearAllData();
    clearSessions();
    toast.success("History cleared");
  };

  return (
    <section className="settings-section">
      <h2>Data</h2>
      <div className="settings-actions">
        <button className="secondary-button" type="button" onClick={exportHistory}>
          <Download size={16} />
          Export all history
        </button>
        <button className="danger-button" type="button" onClick={clearHistory}>
          <Trash2 size={16} />
          Clear all history
        </button>
      </div>
    </section>
  );
};
