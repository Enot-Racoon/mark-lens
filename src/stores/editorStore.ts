import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { MarkdownFile } from "../types";
import { generateId } from "../lib/markdown";
import { useRecentFilesStore } from "./recentFilesStore";
import {
  readFile,
  writeFile,
  isMarkdownFile,
  getFileName,
  setupGlobalFileChangeListener,
  setupReloadFileListener,
  setupFileOpenListener,
  watchFile,
  unwatchFile,
} from "../fs";

/**
 * Update window title with file path and modified status
 */
function updateWindowTitle(path: string | null, isModified: boolean) {
  if (!path) {
    invoke("set_window_title", { title: "Mark Lens" })
      .catch(console.error);
  } else {
    const modifier = isModified ? "* " : "";
    invoke("set_window_title", { title: `${modifier}${path} - Mark Lens` })
      .catch(console.error);
  }
}

interface EditorState {
  currentFile: MarkdownFile | null;
  files: MarkdownFile[];
  isModified: boolean;
  viewMode: "edit" | "preview" | "split";
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  splitRatio: number;
}

interface EditorActions {
  setCurrentFile: (file: MarkdownFile | null) => void;
  setContent: (content: string) => void;
  addFile: (file: MarkdownFile) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<MarkdownFile>) => void;
  openFile: () => Promise<MarkdownFile | null>;
  openFileByPath: (path: string) => Promise<MarkdownFile | null>;
  saveFile: () => Promise<boolean>;
  saveFileAs: () => Promise<MarkdownFile | null>;
  reloadFile: () => Promise<void>;
  setViewMode: (mode: "edit" | "preview" | "split") => void;
  markAsSaved: () => void;
  setupFileWatcher: () => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setSplitRatio: (ratio: number) => void;
}

const initialState: EditorState = {
  currentFile: null,
  files: [],
  isModified: false,
  viewMode: "split",
  sidebarWidth: 250,
  sidebarCollapsed: false,
  splitRatio: 0.5,
};

export const useEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      ...initialState,

    setCurrentFile: (file: MarkdownFile | null) => {
      set({ currentFile: file, isModified: false });
      updateWindowTitle(file?.path ?? null, false);
    },

    setContent: (content: string) => {
      const { currentFile } = get();
      if (currentFile) {
        set({
          currentFile: { ...currentFile, content },
          isModified: true,
        });
        // Update the file in the files array
        const files = get().files.map((f: MarkdownFile) =>
          f.id === currentFile.id ? { ...f, content } : f,
        );
        set({ files });
        // Update window title with modified indicator
        updateWindowTitle(currentFile.path, true);
      }
    },

    addFile: (file: MarkdownFile) => {
      set((state) => ({
        files: [...state.files, file],
        currentFile: file,
        isModified: false,
      }));
    },

    removeFile: (id: string) => {
      const { currentFile, files } = get();
      const remainingFiles = files.filter((f: MarkdownFile) => f.id !== id);
      
      // Determine new currentFile
      let newCurrentFile: MarkdownFile | null = null;
      if (currentFile?.id === id && remainingFiles.length > 0) {
        // Switch to first remaining file
        newCurrentFile = remainingFiles[0];
      } else if (currentFile?.id !== id) {
        // Current file unchanged
        newCurrentFile = currentFile;
      }
      // else: current file was removed and no files remain -> null
      
      set({
        files: remainingFiles,
        currentFile: newCurrentFile,
      });
      
      // Update title based on new current file
      updateWindowTitle(newCurrentFile?.path ?? null, false);
    },

    updateFile: (id: string, updates: Partial<MarkdownFile>) => {
      set((state) => ({
        files: state.files.map((f: MarkdownFile) =>
          f.id === id ? { ...f, ...updates } : f,
        ),
        currentFile:
          state.currentFile?.id === id
            ? { ...state.currentFile, ...updates }
            : state.currentFile,
      }));
    },

    openFile: async () => {
      try {
        const selected = await open({
          multiple: false,
          filters: [
            {
              name: "Markdown",
              extensions: ["md", "markdown", "mdown", "mkd", "mkdn"],
            },
          ],
        });

        if (selected === null) {
          return null;
        }

        const path = Array.isArray(selected) ? selected[0] : selected;
        return get().openFileByPath(path);
      } catch (error) {
        console.error("Failed to open file:", error);
        return null;
      }
    },

    openFileByPath: async (path: string) => {
      console.log("[openFileByPath] Opening file:", path);

      // Validate file type
      if (!isMarkdownFile(path)) {
        console.error("[openFileByPath] Not a markdown file:", path);
        return null;
      }

      const result = await readFile(path);
      if (!result.success) {
        console.error("[openFileByPath] Failed to read file:", result.error);
        return null;
      }

      const file: MarkdownFile = {
        id: generateId(),
        path,
        name: result.name || getFileName(path),
        content: result.content,
        lastModified: Date.now(),
      };

      const { files } = get();
      const existingFile = files.find((f: MarkdownFile) => f.path === path);

      if (existingFile) {
        set({ currentFile: existingFile, isModified: false });
      } else {
        set((state) => ({
          files: [...state.files, file],
          currentFile: file,
          isModified: false,
        }));
      }

      updateWindowTitle(path, false);

      // Add to recent files
      useRecentFilesStore.getState().addRecentFile(path, file.name);

      // Set up file watcher for auto-reload
      unwatchFile(path);
      watchFile(path, {
        onFileChanged: async () => {
          const { currentFile, isModified, reloadFile } = get();
          if (!isModified && currentFile && currentFile.path === path) {
            await reloadFile();
          }
        },
      });

      return file;
    },

    saveFile: async () => {
      const { currentFile } = get();
      if (!currentFile) return false;

      const result = await writeFile(currentFile.path, currentFile.content);
      if (!result.success) {
        console.error("Failed to save file:", result.error);
        return false;
      }

      set({ isModified: false });
      updateWindowTitle(currentFile.path, false);
      return true;
    },

    saveFileAs: async () => {
      const { currentFile } = get();
      if (!currentFile) return null;

      try {
        const selected = await open({
          save: true,
          filters: [
            {
              name: "Markdown",
              extensions: ["md", "markdown", "mdown", "mkd", "mkdn"],
            },
          ],
          defaultPath: currentFile.name,
        });

        if (selected) {
          const path = Array.isArray(selected) ? selected[0] : selected;
          const result = await writeFile(path, currentFile.content);

          if (!result.success) {
            console.error("Failed to save file as:", result.error);
            return null;
          }

          const name = getFileName(path);
          const newFile: MarkdownFile = {
            ...currentFile,
            id: generateId(),
            path,
            name,
          };

          const { files } = get();
          const updatedFiles = files.filter(
            (f: MarkdownFile) => f.id !== currentFile.id,
          );

          set({
            files: [...updatedFiles, newFile],
            currentFile: newFile,
            isModified: false,
          });

          updateWindowTitle(path, false);

          useRecentFilesStore.getState().addRecentFile(path, name);

          return newFile;
        }

        return null;
      } catch (error) {
        console.error("Failed to save file as:", error);
        return null;
      }
    },

    reloadFile: async () => {
      const { currentFile } = get();
      if (!currentFile) return;

      const result = await readFile(currentFile.path);
      if (!result.success) {
        console.error("Failed to reload file:", result.error);
        return;
      }

      const { files } = get();

      const updatedFile = { ...currentFile, content: result.content };
      const updatedFiles = files.map((f: MarkdownFile) =>
        f.id === currentFile.id ? updatedFile : f,
      );

      set({
        files: updatedFiles,
        currentFile: updatedFile,
        isModified: false,
      });

      updateWindowTitle(currentFile.path, false);
    },

    setViewMode: (mode: "edit" | "preview" | "split") => {
      set({ viewMode: mode });
    },

    markAsSaved: () => {
      set({ isModified: false });
    },

    setSidebarWidth: (width: number) => {
      set({ sidebarWidth: Math.max(150, Math.min(500, width)) });
    },

    toggleSidebar: () => {
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },

    setSplitRatio: (ratio: number) => {
      set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) });
    },

    setupFileWatcher: () => {
      // Global file change listener for auto-reload
      setupGlobalFileChangeListener(async (path) => {
        const { currentFile, isModified, reloadFile } = get();
        if (!isModified && currentFile && currentFile.path === path) {
          await reloadFile();
        }
      });

      // Reload file from menu command
      setupReloadFileListener(() => {
        get().reloadFile();
      });

      // Handle file open request from OS
      setupFileOpenListener(async (path) => {
        console.log("[file-open-requested] Path received:", path);
        const file = await get().openFileByPath(path);
        if (file) {
          console.log("[file-open-requested] File opened successfully:", file.name);
        } else {
          console.error("[file-open-requested] Failed to open file:", path);
        }
      });
    },
  }),
  {
    name: "editor-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      viewMode: state.viewMode,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      splitRatio: state.splitRatio,
    }),
  },
));
