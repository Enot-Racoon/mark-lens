import { useEffect } from "react";
import { useEditorStore } from "../stores";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);
  const addFile = useEditorStore((state) => state.addFile);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("[drag-drop] Drop event");

      // Try webkitGetAsEntry API first (works in Tauri)
      const items = e.dataTransfer?.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const entry = (item as any).webkitGetAsEntry?.();
            if (entry) {
              const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(
                entry.name,
              );
              if (isMarkdown) {
                // Get file from files array
                const file = e.dataTransfer?.files[i];
                if (file) {
                  try {
                    const content = await file.text();
                    // fullPath from entry is relative, use file.name as fallback
                    // On macOS with Tauri, we can't get absolute path from drop
                    const path = file.name;
                    console.log("[drag-drop] Adding file:", path);
                    const newFile = {
                      id: crypto.randomUUID(),
                      path: path,
                      name: entry.name,
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

      // Fallback to files array
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        console.log("[drag-drop] Using files array:", files.length);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(file.name);

          if (isMarkdown) {
            try {
              const content = await file.text();
              const newFile = {
                id: crypto.randomUUID(),
                path: file.name,
                name: file.name,
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
    };

    document.body.addEventListener("dragover", handleDragOver);
    document.body.addEventListener("drop", handleDrop);

    return () => {
      document.body.removeEventListener("dragover", handleDragOver);
      document.body.removeEventListener("drop", handleDrop);
    };
  }, [openFileByPath, addFile]);
}
