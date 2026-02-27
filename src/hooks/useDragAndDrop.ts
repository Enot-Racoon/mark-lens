import { useEffect } from "react";
import { useEditorStore } from "../stores";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);

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
          // For security reasons, we can't directly read the file path
          // Instead, we show a message to use the Open dialog
          // In production, you'd use Tauri's file path API
          const path = (file as any).path;
          if (path) {
            await openFileByPath(path);
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
  }, [openFileByPath]);
}
