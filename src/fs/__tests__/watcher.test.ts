import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  watchFile,
  unwatchFile,
  unwatchAll,
  isWatching,
  getActiveWatchersCount,
  setupGlobalFileChangeListener,
  setupReloadFileListener,
  setupFileOpenListener,
} from "../watcher";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

import { listen } from "@tauri-apps/api/event";

describe("fs/watcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unwatchAll();
  });

  describe("watchFile", () => {
    it("should create a watcher for a file", async () => {
      const mockUnlisten = vi.fn();
      (listen as any).mockResolvedValue(mockUnlisten);

      const handle = await watchFile("/test/file.md", {
        onFileChanged: vi.fn(),
      });

      expect(handle.path).toBe("/test/file.md");
      expect(typeof handle.stop).toBe("function");
      expect(isWatching("/test/file.md")).toBe(true);
    });

    it("should return existing watcher for same file", async () => {
      const mockUnlisten = vi.fn();
      (listen as any).mockResolvedValue(mockUnlisten);

      const handle1 = await watchFile("/test/file.md", {
        onFileChanged: vi.fn(),
      });

      const handle2 = await watchFile("/test/file.md", {
        onFileChanged: vi.fn(),
      });

      expect(handle1).toBe(handle2);
      expect(getActiveWatchersCount()).toBe(1);
    });

    it("should increment watcher count for different files", async () => {
      const mockUnlisten = vi.fn();
      (listen as any).mockResolvedValue(mockUnlisten);

      await watchFile("/test/file1.md", { onFileChanged: vi.fn() });
      await watchFile("/test/file2.md", { onFileChanged: vi.fn() });

      expect(getActiveWatchersCount()).toBe(2);
    });
  });

  describe("unwatchFile", () => {
    it("should stop watching a file", async () => {
      const mockUnlisten = vi.fn();
      (listen as any).mockResolvedValue(mockUnlisten);

      await watchFile("/test/file.md", { onFileChanged: vi.fn() });
      expect(isWatching("/test/file.md")).toBe(true);

      unwatchFile("/test/file.md");
      expect(isWatching("/test/file.md")).toBe(false);
      expect(mockUnlisten).toHaveBeenCalled();
    });

    it("should not throw if file is not being watched", () => {
      expect(() => unwatchFile("/test/file.md")).not.toThrow();
    });
  });

  describe("unwatchAll", () => {
    it("should stop all watchers", async () => {
      const mockUnlisten = vi.fn();
      (listen as any).mockResolvedValue(mockUnlisten);

      await watchFile("/test/file1.md", { onFileChanged: vi.fn() });
      await watchFile("/test/file2.md", { onFileChanged: vi.fn() });

      expect(getActiveWatchersCount()).toBe(2);

      unwatchAll();

      expect(getActiveWatchersCount()).toBe(0);
      expect(isWatching("/test/file1.md")).toBe(false);
      expect(isWatching("/test/file2.md")).toBe(false);
    });
  });

  describe("setupGlobalFileChangeListener", () => {
    it("should set up file change listener", async () => {
      const onFileChanged = vi.fn();

      (listen as any).mockImplementation((event: string, cb: any) => {
        if (event === "file-changed") {
          setTimeout(() => cb({ payload: "/test/file.md" }), 0);
        }
        return Promise.resolve(vi.fn());
      });

      const cleanup = setupGlobalFileChangeListener(onFileChanged) as (() => void);

      expect(listen).toHaveBeenCalledWith("file-changed", expect.any(Function));

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onFileChanged).toHaveBeenCalledWith("/test/file.md");

      cleanup();
    });
  });

  describe("setupReloadFileListener", () => {
    it("should set up reload file listener", async () => {
      const onReload = vi.fn();

      (listen as any).mockImplementation((event: string, cb: any) => {
        if (event === "reload-file") {
          setTimeout(() => cb({}), 0);
        }
        return Promise.resolve(vi.fn());
      });

      const cleanup = setupReloadFileListener(onReload) as (() => void);

      expect(listen).toHaveBeenCalledWith("reload-file", expect.any(Function));

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onReload).toHaveBeenCalled();

      cleanup();
    });
  });

  describe("setupFileOpenListener", () => {
    it("should set up file open listener", async () => {
      const onFileOpen = vi.fn();

      (listen as any).mockImplementation((event: string, cb: any) => {
        if (event === "file-open-requested") {
          setTimeout(() => cb({ payload: "/test/file.md" }), 0);
        }
        return Promise.resolve(vi.fn());
      });

      const cleanup = setupFileOpenListener(onFileOpen) as (() => void);

      expect(listen).toHaveBeenCalledWith(
        "file-open-requested",
        expect.any(Function)
      );

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onFileOpen).toHaveBeenCalledWith("/test/file.md");

      cleanup();
    });

    it("should not call onFileOpen if payload is empty", async () => {
      const onFileOpen = vi.fn();

      (listen as any).mockImplementation((event: string, cb: any) => {
        if (event === "file-open-requested") {
          setTimeout(() => cb({ payload: null }), 0);
        }
        return Promise.resolve(vi.fn());
      });

      setupFileOpenListener(onFileOpen);

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onFileOpen).not.toHaveBeenCalled();
    });
  });
});
