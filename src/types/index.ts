export interface MarkdownFile {
  id: string;
  path: string;
  name: string;
  content: string;
  lastModified?: number;
}

export interface EditorState {
  currentFile: MarkdownFile | null;
  files: MarkdownFile[];
  isModified: boolean;
  viewMode: "edit" | "preview" | "split";
}

export interface FileSystemEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  children?: FileSystemEntry[];
}
