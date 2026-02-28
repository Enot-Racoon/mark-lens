/**
 * File system operations - Rust backend via Tauri commands
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  ReadFileResult,
  WriteFileResult,
  AccessCheckResult,
  ListDirOptions,
  ListDirResult,
} from "./types";

/**
 * Read text file content
 */
export async function readFile(path: string): Promise<ReadFileResult> {
  return invoke("read_file", { path });
}

/**
 * Write text content to file
 */
export async function writeFile(path: string, content: string): Promise<WriteFileResult> {
  return invoke("write_file", { path, content });
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  return invoke("file_exists", { path });
}

/**
 * Check file access permissions (readable/writable)
 */
export async function checkAccess(path: string): Promise<AccessCheckResult> {
  return invoke("check_access", { path });
}

/**
 * List directory contents
 */
export async function listDir(
  path: string,
  options?: ListDirOptions,
): Promise<ListDirResult> {
  const result: ListDirResult = await invoke("list_dir", { path });

  if (!result.success) {
    return result;
  }

  let entries = result.entries;

  // Apply filter if provided
  if (options?.filter) {
    entries = entries.filter(options.filter);
  }

  return {
    ...result,
    entries,
  };
}

/**
 * Get file extension
 */
export function getFileExtension(path: string): string {
  const ext = path.split(".").pop();
  return ext ? ext.toLowerCase() : "";
}

/**
 * Check if file is a markdown file
 */
export function isMarkdownFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ["md", "markdown", "mdown", "mkd", "mkdn"].includes(ext);
}

/**
 * Get file name from path
 */
export function getFileName(path: string): string {
  return path.split("/").pop() || path.split("\\").pop() || path;
}
