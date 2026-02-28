/**
 * File System Layer - Public API
 *
 * Provides a clean abstraction over Tauri's file system operations:
 * - File operations (read, write, check access)
 * - Directory listing
 * - File watching
 */

// Types
export type {
  FileEntry,
  ReadFileResult,
  WriteFileResult,
  AccessCheckResult,
  WatcherOptions,
  WatcherHandle,
  FileFilter,
  ListDirOptions,
  ListDirResult,
} from "./types";

// Operations
export {
  readFile,
  writeFile,
  fileExists,
  checkAccess,
  listDir,
  getFileExtension,
  isMarkdownFile,
  getFileName,
} from "./operations";

// Watcher
export {
  watchFile,
  unwatchFile,
  unwatchAll,
  isWatching,
  getActiveWatchersCount,
  setupGlobalFileChangeListener,
  setupReloadFileListener,
  setupFileOpenListener,
} from "./watcher";
