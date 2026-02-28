import { useEffect } from "react";
import { useEditorStore } from "../stores";
import { generateId } from "../lib/markdown";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);
  const addFile = useEditorStore((state) => state.addFile);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Handle file paths from OS (macOS Finder, Windows Explorer)
      // Tauri provides file paths through dataTransfer items
      const items = e.dataTransfer?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file" && item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry && entry.isFile) {
              const fileEntry = entry as FileSystemFileEntry;
              
              // Check if it's a markdown file
              const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(fileEntry.name);
              if (isMarkdown) {
                // For security reasons, we can't get the full path directly
                // We need to use the file object from dataTransfer.files
                const file = e.dataTransfer?.files[i];
                if (file) {
                  try {
                    const content = await file.text();
                    const newFile = {
                      id: generateId(),
                      path: fileEntry.name,
                      name: fileEntry.name,
                      content,
                      lastModified: file.lastModified,
                    };
                    addFile(newFile);
                  } catch (error) {
                    console.error("Failed to read dropped file:", error);
                  }
                }
              }
            }
          }
        }
        return;
      }

      // Fallback: handle files array directly
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(file.name);

        if (isMarkdown) {
          try {
            const content = await file.text();
            const newFile = {
              id: generateId(),
              path: file.name,
              name: file.name,
              content,
              lastModified: file.lastModified,
            };
            addFile(newFile);
          } catch (error) {
            console.error("Failed to open dropped file:", error);
          }
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [openFileByPath, addFile]);
}
