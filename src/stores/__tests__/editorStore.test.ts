import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEditorStore } from "../editorStore";
import type { MarkdownFile } from "../../types";

// Mock the fs module
vi.mock("../../lib/fs", () => ({
  readMarkdownFile: vi.fn(),
  writeMarkdownFile: vi.fn(),
  exists: vi.fn(),
  readDir: vi.fn(),
  openMarkdownFile: vi.fn(),
  saveMarkdownFile: vi.fn(),
  saveMarkdownFileAs: vi.fn(),
  readDirectory: vi.fn(),
}));

describe("useEditorStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.setState({
      currentFile: null,
      files: [],
      isModified: false,
      viewMode: "split",
    });
  });

  const mockFile: MarkdownFile = {
    id: "test-id",
    path: "/test/file.md",
    name: "test.md",
    content: "# Test\n\nContent",
    lastModified: Date.now(),
  };

  describe("setCurrentFile", () => {
    it("should set the current file", () => {
      useEditorStore.getState().setCurrentFile(mockFile);
      expect(useEditorStore.getState().currentFile).toEqual(mockFile);
    });

    it("should reset isModified to false", () => {
      useEditorStore.getState().setCurrentFile(mockFile);
      expect(useEditorStore.getState().isModified).toBe(false);
    });

    it("should set current file to null", () => {
      useEditorStore.getState().setCurrentFile(null);
      expect(useEditorStore.getState().currentFile).toBeNull();
    });
  });

  describe("setContent", () => {
    it("should update content of current file", () => {
      useEditorStore.getState().setCurrentFile(mockFile);
      useEditorStore.getState().setContent("# New Content");
      expect(useEditorStore.getState().currentFile?.content).toBe("# New Content");
    });

    it("should set isModified to true", () => {
      useEditorStore.getState().setCurrentFile(mockFile);
      useEditorStore.getState().setContent("# New Content");
      expect(useEditorStore.getState().isModified).toBe(true);
    });

    it("should update file in files array", () => {
      useEditorStore.getState().addFile(mockFile);
      useEditorStore.getState().setContent("# Updated");
      const files = useEditorStore.getState().files;
      expect(files[0].content).toBe("# Updated");
    });
  });

  describe("addFile", () => {
    it("should add file to files array", () => {
      useEditorStore.getState().addFile(mockFile);
      expect(useEditorStore.getState().files).toHaveLength(1);
      expect(useEditorStore.getState().files[0]).toEqual(mockFile);
    });

    it("should set added file as current", () => {
      useEditorStore.getState().addFile(mockFile);
      expect(useEditorStore.getState().currentFile).toEqual(mockFile);
    });

    it("should reset isModified to false", () => {
      useEditorStore.getState().addFile(mockFile);
      expect(useEditorStore.getState().isModified).toBe(false);
    });
  });

  describe("removeFile", () => {
    it("should remove file from files array", () => {
      useEditorStore.getState().addFile(mockFile);
      useEditorStore.getState().removeFile(mockFile.id);
      expect(useEditorStore.getState().files).toHaveLength(0);
    });

    it("should clear currentFile if removed file is current", () => {
      useEditorStore.getState().addFile(mockFile);
      useEditorStore.getState().removeFile(mockFile.id);
      expect(useEditorStore.getState().currentFile).toBeNull();
    });

    it("should keep currentFile if different file is removed", () => {
      const file1 = { ...mockFile, id: "1" };
      const file2 = { ...mockFile, id: "2" };
      useEditorStore.getState().addFile(file1);
      useEditorStore.getState().addFile(file2);
      useEditorStore.getState().removeFile(file1.id);
      expect(useEditorStore.getState().currentFile?.id).toBe("2");
    });
  });

  describe("updateFile", () => {
    it("should update file properties", () => {
      useEditorStore.getState().addFile(mockFile);
      useEditorStore.getState().updateFile(mockFile.id, { name: "updated.md" });
      expect(useEditorStore.getState().files[0].name).toBe("updated.md");
    });

    it("should update currentFile if it's the updated file", () => {
      useEditorStore.getState().addFile(mockFile);
      useEditorStore.getState().updateFile(mockFile.id, { name: "updated.md" });
      expect(useEditorStore.getState().currentFile?.name).toBe("updated.md");
    });
  });

  describe("setViewMode", () => {
    it("should set view mode to edit", () => {
      useEditorStore.getState().setViewMode("edit");
      expect(useEditorStore.getState().viewMode).toBe("edit");
    });

    it("should set view mode to preview", () => {
      useEditorStore.getState().setViewMode("preview");
      expect(useEditorStore.getState().viewMode).toBe("preview");
    });

    it("should set view mode to split", () => {
      useEditorStore.getState().setViewMode("split");
      expect(useEditorStore.getState().viewMode).toBe("split");
    });
  });

  describe("markAsSaved", () => {
    it("should set isModified to false", () => {
      useEditorStore.getState().setCurrentFile(mockFile);
      useEditorStore.getState().setContent("# Changed");
      expect(useEditorStore.getState().isModified).toBe(true);
      useEditorStore.getState().markAsSaved();
      expect(useEditorStore.getState().isModified).toBe(false);
    });
  });
});
