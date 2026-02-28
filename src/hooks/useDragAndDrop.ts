import { useEffect } from "react";
import { useEditorStore } from "../stores";
import { generateId } from "../lib/markdown";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);
  const addFile = useEditorStore((state) => state.addFile);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = "copy";
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(file.name);

        if (isMarkdown) {
          try {
            // Use Tauri FS API to read the file
            // We need to get the file path from the OS
            const path = (file as any).path;
            if (path) {
              await openFileByPath(path);
            } else {
              // Fallback: read file content directly
              const content = await file.text();
              const newFile = {
                id: generateId(),
                path: file.name,
                name: file.name,
                content,
                lastModified: file.lastModified,
              };
              addFile(newFile);
            }
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
