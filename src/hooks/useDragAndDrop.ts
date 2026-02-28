import { useEffect } from "react";
import { useEditorStore } from "../stores";
import { listen } from "@tauri-apps/api/event";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);

  useEffect(() => {
    // Listen to Tauri's native file drop event
    const unlisten = listen<string[]>("tauri://file-drop", async (event) => {
      const paths = event.payload;
      console.log("[file-drop] Files dropped:", paths);

      for (const path of paths) {
        // Check if it's a markdown file
        const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(path);
        if (isMarkdown) {
          try {
            await openFileByPath(path);
          } catch (error) {
            console.error("Failed to open dropped file:", error);
          }
        }
      }
    });

    // Also listen to file-drop-hovered for visual feedback (optional)
    const unlistenHover = listen<string[]>("tauri://file-drop-hovered", () => {
      // Can add visual feedback here
    });

    // Prevent default browser behavior
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      unlisten.then((fn) => fn());
      unlistenHover.then((fn) => fn());
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [openFileByPath]);
}
