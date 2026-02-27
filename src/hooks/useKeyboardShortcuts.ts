import { useEffect, useCallback } from "react";
import { useEditorStore } from "../stores";

interface UseKeyboardShortcutsOptions {
  onSave?: () => void;
  onSaveAs?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onSave, onSaveAs } = options;
  const { saveFile, saveFileAs } = useEditorStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl/Cmd + Shift + S (Save As)
          if (onSaveAs) {
            onSaveAs();
          } else {
            saveFileAs();
          }
        } else {
          // Ctrl/Cmd + S (Save)
          if (onSave) {
            onSave();
          } else {
            saveFile();
          }
        }
      }
    },
    [saveFile, saveFileAs, onSave, onSaveAs]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
