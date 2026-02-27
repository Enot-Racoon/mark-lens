import { create } from "zustand";
import type { MarkdownFile, EditorState } from "../types";
import { saveMarkdownFile, openMarkdownFile, saveMarkdownFileAs } from "../lib/fs";

interface EditorActions {
  setCurrentFile: (file: MarkdownFile | null) => void;
  setContent: (content: string) => void;
  addFile: (file: MarkdownFile) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<MarkdownFile>) => void;
  openFile: () => Promise<MarkdownFile | null>;
  saveFile: () => Promise<boolean>;
  saveFileAs: () => Promise<MarkdownFile | null>;
  setViewMode: (mode: "edit" | "preview" | "split") => void;
  markAsSaved: () => void;
}

const initialState: EditorState = {
  currentFile: null,
  files: [],
  isModified: false,
  viewMode: "split",
};

export const useEditorStore = create<EditorState & EditorActions>()((set, get) => ({
  ...initialState,

  setCurrentFile: (file) => {
    set({ currentFile: file, isModified: false });
  },

  setContent: (content) => {
    const { currentFile } = get();
    if (currentFile) {
      set({
        currentFile: { ...currentFile, content },
        isModified: true,
      });
      // Update the file in the files array
      const files = get().files.map((f) =>
        f.id === currentFile.id ? { ...f, content } : f
      );
      set({ files });
    }
  },

  addFile: (file) => {
    set((state) => ({
      files: [...state.files, file],
      currentFile: file,
      isModified: false,
    }));
  },

  removeFile: (id) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      currentFile: state.currentFile?.id === id ? null : state.currentFile,
    }));
  },

  updateFile: (id, updates) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
      currentFile:
        state.currentFile?.id === id
          ? { ...state.currentFile, ...updates }
          : state.currentFile,
    }));
  },

  openFile: async () => {
    try {
      const file = await openMarkdownFile();
      if (file) {
        const { files } = get();
        // Check if file is already open
        const existingFile = files.find((f) => f.path === file.path);
        if (existingFile) {
          set({ currentFile: existingFile, isModified: false });
        } else {
          set((state) => ({
            files: [...state.files, file],
            currentFile: file,
            isModified: false,
          }));
        }
      }
      return file;
    } catch (error) {
      console.error("Failed to open file:", error);
      return null;
    }
  },

  saveFile: async () => {
    const { currentFile } = get();
    if (!currentFile) return false;

    try {
      const success = await saveMarkdownFile(currentFile);
      if (success) {
        set({ isModified: false });
      }
      return success;
    } catch (error) {
      console.error("Failed to save file:", error);
      return false;
    }
  },

  saveFileAs: async () => {
    const { currentFile } = get();
    if (!currentFile) return null;

    try {
      const newFile = await saveMarkdownFileAs(currentFile);
      if (newFile) {
        const { files } = get();
        // Remove old file if it exists and add new one
        const updatedFiles = files.filter((f) => f.id !== currentFile.id);
        set({
          files: [...updatedFiles, newFile],
          currentFile: newFile,
          isModified: false,
        });
      }
      return newFile;
    } catch (error) {
      console.error("Failed to save file as:", error);
      return null;
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  markAsSaved: () => {
    set({ isModified: false });
  },
}));
