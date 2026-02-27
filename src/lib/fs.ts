import { readTextFile, writeTextFile, exists, readDir, type DirEntry } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { MarkdownFile, FileSystemEntry } from "../types";
import { generateId } from "./markdown";

/**
 * Read a markdown file from the file system
 */
export async function readMarkdownFile(path: string): Promise<MarkdownFile> {
  const content = await readTextFile(path);
  const name = path.split("/").pop() || path;
  
  return {
    id: generateId(),
    path,
    name,
    content,
    lastModified: Date.now(),
  };
}

/**
 * Write a markdown file to the file system
 */
export async function writeMarkdownFile(file: MarkdownFile): Promise<void> {
  await writeTextFile(file.path, file.content);
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  return exists(path);
}

/**
 * Open a file dialog to select a markdown file
 */
export async function openMarkdownFile(): Promise<MarkdownFile | null> {
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
  return readMarkdownFile(path);
}

/**
 * Save a markdown file (either to existing path or new location)
 */
export async function saveMarkdownFile(file: MarkdownFile): Promise<boolean> {
  try {
    if (file.path) {
      await writeMarkdownFile(file);
      return true;
    } else {
      const path = await save({
        filters: [
          {
            name: "Markdown",
            extensions: ["md", "markdown", "mdown", "mkd", "mkdn"],
          },
        ],
        defaultPath: file.name || "untitled.md",
      });

      if (path) {
        await writeTextFile(path, file.content);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Failed to save file:", error);
    return false;
  }
}

/**
 * Save a markdown file to a new location
 */
export async function saveMarkdownFileAs(file: MarkdownFile): Promise<MarkdownFile | null> {
  const path = await save({
    filters: [
      {
        name: "Markdown",
        extensions: ["md", "markdown", "mdown", "mkd", "mkdn"],
      },
    ],
    defaultPath: file.name || "untitled.md",
  });

  if (path) {
    await writeTextFile(path, file.content);
    const name = path.split("/").pop() || path;
    return {
      ...file,
      id: generateId(),
      path,
      name,
      lastModified: Date.now(),
    };
  }

  return null;
}

/**
 * Read directory contents
 */
export async function readDirectory(path: string): Promise<FileSystemEntry[]> {
  try {
    const entries = await readDir(path);
    return entries.map((entry: DirEntry) => ({
      path: `${path}/${entry.name}`,
      name: entry.name,
      isDirectory: entry.isDirectory,
      children: entry.isDirectory ? [] : undefined,
    }));
  } catch (error) {
    console.error("Failed to read directory:", error);
    return [];
  }
}
