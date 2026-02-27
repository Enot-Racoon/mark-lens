import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import type { RecentFile } from "../types";

interface RecentFilesState {
  recentFiles: RecentFile[];
  loadRecentFiles: () => Promise<void>;
  addRecentFile: (path: string, name: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;
}

export const useRecentFilesStore = create<RecentFilesState>()((set, get) => ({
  recentFiles: [],

  loadRecentFiles: async () => {
    try {
      const files = await invoke<RecentFile[]>("get_recent_files");
      set({ recentFiles: files });
    } catch (error) {
      console.error("Failed to load recent files:", error);
    }
  },

  addRecentFile: async (path: string, name: string) => {
    try {
      await invoke("add_recent_file", { path, name });
      await get().loadRecentFiles();
    } catch (error) {
      console.error("Failed to add recent file:", error);
    }
  },

  clearRecentFiles: async () => {
    try {
      await invoke("clear_recent_files");
      set({ recentFiles: [] });
    } catch (error) {
      console.error("Failed to clear recent files:", error);
    }
  },
}));

// Listen for recent files changes
listen("recent-files-changed", () => {
  useRecentFilesStore.getState().loadRecentFiles();
});
