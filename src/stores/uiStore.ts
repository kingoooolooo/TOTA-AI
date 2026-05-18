import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  historyExpanded: boolean;
  streaming: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setHistoryExpanded: (expanded: boolean) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  historyExpanded: false,
  streaming: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setHistoryExpanded: (historyExpanded) => set({ historyExpanded }),
  setStreaming: (streaming) => set({ streaming })
}));
