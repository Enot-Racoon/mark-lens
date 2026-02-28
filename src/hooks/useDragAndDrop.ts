import { useEffect } from "react";
import { useEditorStore } from "../stores";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);

  useEffect(() => {
    console.log("[drag-drop] Setting up native file drop listener");

    // Use Tauri's native file-drop event which provides full file paths
    import("@tauri-apps/api/event").then(({ listen }) => {
      const unlisten = listen<string[]>("file-drop", (event) => {
        console.log("[file-drop] Native event received:", event.payload);
        
        event.payload.forEach((path) => {
          const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(path);
          if (isMarkdown) {
            console.log("[file-drop] Opening markdown file:", path);
            openFileByPath(path);
          }
        });
      }).catch((err) => {
        console.error("[file-drop] Failed to set up listener:", err);
      });

      return () => {
        unlisten.then((fn) => {
          if (typeof fn === 'function') {
            fn();
          }
        }).catch(console.error);
      };
    });

    // Prevent default browser behavior
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.body.addEventListener("dragover", handleDragOver);
    document.body.addEventListener("drop", handleDrop);

    return () => {
      document.body.removeEventListener("dragover", handleDragOver);
      document.body.removeEventListener("drop", handleDrop);
    };
  }, [openFileByPath]);
}
