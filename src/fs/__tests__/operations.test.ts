import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFile, writeFile, fileExists, checkAccess, listDir } from "../operations";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("fs/operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readFile", () => {
    it("should return file content on success", async () => {
      const mockResult = {
        path: "/test/file.md",
        name: "file.md",
        content: "# Hello World",
        success: true,
        error: null,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await readFile("/test/file.md");

      expect(invoke).toHaveBeenCalledWith("read_file", { path: "/test/file.md" });
      expect(result.success).toBe(true);
      expect(result.content).toBe("# Hello World");
      expect(result.name).toBe("file.md");
    });

    it("should return error on failure", async () => {
      const mockResult = {
        path: "/test/file.md",
        name: "file.md",
        content: "",
        success: false,
        error: "File not found",
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await readFile("/test/file.md");

      expect(result.success).toBe(false);
      expect(result.error).toBe("File not found");
    });
  });

  describe("writeFile", () => {
    it("should return success on write", async () => {
      const mockResult = {
        path: "/test/file.md",
        success: true,
        error: null,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await writeFile("/test/file.md", "content");

      expect(invoke).toHaveBeenCalledWith("write_file", {
        path: "/test/file.md",
        content: "content",
      });
      expect(result.success).toBe(true);
    });

    it("should return error on write failure", async () => {
      const mockResult = {
        path: "/test/file.md",
        success: false,
        error: "Permission denied",
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await writeFile("/test/file.md", "content");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Permission denied");
    });
  });

  describe("fileExists", () => {
    it("should return true if file exists", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(true);

      const result = await fileExists("/test/file.md");

      expect(invoke).toHaveBeenCalledWith("file_exists", { path: "/test/file.md" });
      expect(result).toBe(true);
    });

    it("should return false if file does not exist", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(false);

      const result = await fileExists("/test/file.md");

      expect(result).toBe(false);
    });
  });

  describe("checkAccess", () => {
    it("should return access check result", async () => {
      const mockResult = {
        path: "/test/file.md",
        readable: true,
        writable: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await checkAccess("/test/file.md");

      expect(invoke).toHaveBeenCalledWith("check_access", { path: "/test/file.md" });
      expect(result.readable).toBe(true);
      expect(result.writable).toBe(true);
    });
  });

  describe("listDir", () => {
    it("should return directory entries on success", async () => {
      const mockResult = {
        path: "/test",
        entries: [
          {
            path: "/test/file1.md",
            name: "file1.md",
            is_directory: false,
            size: 1024,
            last_modified: 1234567890,
          },
          {
            path: "/test/subdir",
            name: "subdir",
            is_directory: true,
            size: undefined,
            last_modified: 1234567890,
          },
        ],
        success: true,
        error: null,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await listDir("/test");

      expect(invoke).toHaveBeenCalledWith("list_dir", { path: "/test" });
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].is_directory).toBe(false);
      expect(result.entries[1].is_directory).toBe(true);
    });

    it("should apply filter to entries", async () => {
      const mockResult = {
        path: "/test",
        entries: [
          {
            path: "/test/file1.md",
            name: "file1.md",
            is_directory: false,
          },
          {
            path: "/test/file2.txt",
            name: "file2.txt",
            is_directory: false,
          },
        ],
        success: true,
        error: null,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await listDir("/test", {
        filter: (entry) => entry.name.endsWith(".md"),
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].name).toBe("file1.md");
    });

    it("should return error on failure", async () => {
      const mockResult = {
        path: "/test",
        entries: [],
        success: false,
        error: "Directory not found",
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await listDir("/test");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Directory not found");
    });
  });
});
