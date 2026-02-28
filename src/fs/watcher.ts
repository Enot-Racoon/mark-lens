/**
 * File watcher management
 * Handles setting up and cleaning up file system watchers
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { WatcherHandle, WatcherOptions } from "./types";

/**
 * Active watchers map - one watcher per file path
 */
const activeWatchers = new Map<string, WatcherHandle>();

/**
 * Set up a watcher for a specific file
 * Returns a handle to stop the watcher
 */
export async function watchFile(
  path: string,
  options: WatcherOptions,
): Promise<WatcherHandle> {
  // If already watching this file, return existing handle
  const existing = activeWatchers.get(path);
  if (existing) {
    return existing;
  }

  let unlisten: UnlistenFn | null = null;

  // Listen for file-changed events from Rust backend
  const unlistenFn = await listen("file-changed", (event) => {
    if (event.payload === path) {
      options.onFileChanged(path);
    }
  });

  unlisten = () => {
    unlistenFn();
  };

  const handle: WatcherHandle = {
    path,
    stop: () => {
      if (unlisten) {
        unlisten();
        activeWatchers.delete(path);
      }
    },
  };

  activeWatchers.set(path, handle);

  return handle;
}

/**
 * Stop watching a specific file
 */
export function unwatchFile(path: string): void {
  const handle = activeWatchers.get(path);
  if (handle) {
    handle.stop();
  }
}

/**
 * Stop all active watchers
 */
export function unwatchAll(): void {
  for (const handle of activeWatchers.values()) {
    handle.stop();
  }
  activeWatchers.clear();
}

/**
 * Check if a file is being watched
 */
export function isWatching(path: string): boolean {
  return activeWatchers.has(path);
}

/**
 * Get count of active watchers
 */
export function getActiveWatchersCount(): number {
  return activeWatchers.size;
}

/**
 * Set up global file change listener for auto-reload
 * This is used by the editor store to handle external file changes
 */
export function setupGlobalFileChangeListener(
  onFileChanged: (path: string) => void,
): () => void {
  let unlisten: UnlistenFn | null = null;

  listen("file-changed", (event) => {
    onFileChanged(event.payload as string);
  }).then((fn) => {
    unlisten = fn;
  });

  return () => {
    if (unlisten) {
      unlisten();
    }
  };
}

/**
 * Set up reload-file event listener (from menu command)
 */
export function setupReloadFileListener(onReload: () => void): () => void {
  let unlisten: UnlistenFn | null = null;

  listen("reload-file", () => {
    onReload();
  }).then((fn) => {
    unlisten = fn;
  });

  return () => {
    if (unlisten) {
      unlisten();
    }
  };
}

/**
 * Set up file-open-requested event listener (from OS)
 */
export function setupFileOpenListener(
  onFileOpen: (path: string) => void,
): () => void {
  let unlisten: UnlistenFn | null = null;

  console.log("[setupFileOpenListener] Setting up listener for file-open-requested");
  
  listen<string>("file-open-requested", (event) => {
    console.log("[file-open-requested] Event received:", event);
    const payload = event.payload;
    console.log("[file-open-requested] Payload:", payload);
    if (payload) {
      onFileOpen(payload);
    }
  }).then((fn) => {
    unlisten = fn;
    console.log("[setupFileOpenListener] Listener registered");
  }).catch((err) => {
    console.error("[setupFileOpenListener] Failed to register listener:", err);
  });

  return () => {
    if (unlisten) {
      unlisten();
    }
  };
}
