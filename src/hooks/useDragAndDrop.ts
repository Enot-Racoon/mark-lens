import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useDragAndDrop() {
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

      // Get files from dataTransfer
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(file.name);

          if (isMarkdown) {
            console.log("[drag-drop] File dropped:", file.name);
            // Invoke Rust to handle file drop through unified flow
            // This ensures consistent behavior with CLI, file associations, etc.
            invoke("handle_file_drop", { path: file.name })
              .catch((err) => {
                console.error("[drag-drop] Failed to handle file drop:", err);
              });
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
  }, []);
}
