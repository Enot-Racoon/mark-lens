import { useEffect } from "react";
import { useEditorStore } from "../stores";

export function useDragAndDrop() {
  const openFileByPath = useEditorStore((state) => state.openFileByPath);

  useEffect(() => {
    console.log("[drag-drop] Setting up drag-drop handlers");

    // Prevent default browser behavior for drag-drop
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      console.log("[drag-drop] Drop event captured");
      
      // Try to get file paths from dataTransfer
      const files = e.dataTransfer?.files;
      console.log("[drag-drop] Files count:", files?.length);
      
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log("[drag-drop] File:", file.name, file.type);
          
          const isMarkdown = /\.(md|markdown|mdown|mkd|mkdn)$/i.test(file.name);
          if (isMarkdown) {
            try {
              // Read file content directly
              const content = await file.text();
              console.log("[drag-drop] Read file content, length:", content.length);
              
              // Create file object and add it
              const newFile = {
                id: crypto.randomUUID(),
                path: file.name,
                name: file.name,
                content,
                lastModified: file.lastModified,
              };
              
              openFileByPath(file.name).catch(() => {
                // If openFileByPath fails, just add the file with content
                const addFile = useEditorStore.getState().addFile;
                addFile(newFile as any);
              });
            } catch (error) {
              console.error("[drag-drop] Failed to read file:", error);
            }
          }
        }
      }
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [openFileByPath]);
}
