import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { MarkdownFile } from "../types";
import { generateId } from "../lib/markdown";
import { useRecentFilesStore } from "./recentFilesStore";

interface EditorState {
  currentFile: MarkdownFile | null;
  files: MarkdownFile[];
  isModified: boolean;
  viewMode: "edit" | "preview" | "split";
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
}

const initialState: EditorState = {
  currentFile: null,
  files: [],
  isModified: false,
  viewMode: "split",
};

export const useEditorStore = create<EditorState & EditorActions>()(
  (set, get) => ({
    ...initialState,

    setCurrentFile: (file: MarkdownFile | null) => {
      set({ currentFile: file, isModified: false });
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
      set((state) => ({
        files: state.files.filter((f: MarkdownFile) => f.id !== id),
        currentFile: state.currentFile?.id === id ? null : state.currentFile,
      }));
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
      try {
        const content = await readTextFile(path);
        const name = path.split("/").pop() || path.split("\\").pop() || path;

        const file: MarkdownFile = {
          id: generateId(),
          path,
          name,
          content,
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

        // Add to recent files
        useRecentFilesStore.getState().addRecentFile(path, name);

        return file;
      } catch (error) {
        console.error("Failed to read file:", error);
        return null;
      }
    },

    saveFile: async () => {
      const { currentFile } = get();
      if (!currentFile) return false;

      try {
        await writeTextFile(currentFile.path, currentFile.content);
        set({ isModified: false });
        return true;
      } catch (error) {
        console.error("Failed to save file:", error);
        return false;
      }
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
          await writeTextFile(path, currentFile.content);

          const name = path.split("/").pop() || path.split("\\").pop() || path;
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

      try {
        const content = await readTextFile(currentFile.path);
        const { files } = get();

        const updatedFile = { ...currentFile, content };
        const updatedFiles = files.map((f: MarkdownFile) =>
          f.id === currentFile.id ? updatedFile : f,
        );

        set({
          files: updatedFiles,
          currentFile: updatedFile,
          isModified: false,
        });
      } catch (error) {
        console.error("Failed to reload file:", error);
      }
    },

    setViewMode: (mode: "edit" | "preview" | "split") => {
      set({ viewMode: mode });
    },

    markAsSaved: () => {
      set({ isModified: false });
    },

    setupFileWatcher: () => {
      // Listen for file-changed events from Rust
      listen("file-changed", async (event) => {
        const { currentFile, isModified, reloadFile } = get();

        // Only auto-reload if file is not modified and path matches
        if (!isModified && currentFile && event.payload === currentFile.path) {
          await reloadFile();
        }
      });

      // Listen for reload-file event from menu
      listen("reload-file", () => {
        get().reloadFile();
      });

      // Listen for file-open-requested event from OS
      listen<string>("file-open-requested", async (event) => {
        const path = event.payload;
        console.log("[file-open-requested] Path received:", path);
        if (path) {
          const file = await get().openFileByPath(path);
          if (file) {
            console.log(
              "[file-open-requested] File opened successfully:",
              file.name,
            );
          } else {
            console.error("[file-open-requested] Failed to open file:", path);
          }
        }
      });
    },
  }),
);
