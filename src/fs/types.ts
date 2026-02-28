/**
 * File system operation result types
 */

/**
 * Internal type for Rust directory entry (snake_case)
 */
export interface RustDirEntry {
  path: string;
  name: string;
  is_directory: boolean;
  size?: number;
  last_modified?: number;
}

export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: number;
}

export interface ReadFileResult {
  path: string;
  name: string;
  content: string;
  success: boolean;
  error?: string;
}

export interface WriteFileResult {
  path: string;
  success: boolean;
  error?: string;
}

export interface AccessCheckResult {
  path: string;
  readable: boolean;
  writable: boolean;
}

export interface WatcherOptions {
  onFileChanged: (path: string) => void;
}

export interface WatcherHandle {
  path: string;
  stop: () => void;
}

export type FileFilter = (entry: RustDirEntry) => boolean;

export interface ListDirOptions {
  filter?: FileFilter;
  recursive?: boolean;
}

export interface ListDirResult {
  path: string;
  entries: RustDirEntry[];
  success: boolean;
  error?: string;
}
