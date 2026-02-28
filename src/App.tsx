import { useEffect } from "react";
import { Toolbar, Sidebar, MarkdownEditor } from "./components";
import { useEditorStore, useRecentFilesStore } from "./stores";
import { useDragAndDrop } from "./hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const setupFileWatcher = useEditorStore((state) => state.setupFileWatcher);
  const loadRecentFiles = useRecentFilesStore((state) => state.loadRecentFiles);
  const openFileByPath = useEditorStore((state) => state.openFileByPath);

  useEffect(() => {
    setupFileWatcher();
    loadRecentFiles();

    // Get files passed at startup via file association or CLI args
    invoke<string[]>("get_startup_files")
      .then((paths) => {
        console.log("[App] Startup files:", paths);
        paths.forEach((path) => {
          console.log("[App] Opening startup file:", path);
          openFileByPath(path);
        });
        // Clear the startup files so they're not opened again
        invoke("clear_startup_files").catch(console.error);
      })
      .catch((err) => {
        console.error("[App] Failed to get startup files:", err);
      });
  }, [setupFileWatcher, loadRecentFiles, openFileByPath]);

  useDragAndDrop();

  return (
    <div className="app" data-tauri-drag-region>
      <Toolbar />
      <div className="app-body" data-tauri-drag-region>
        <Sidebar />
        <MarkdownEditor />
      </div>
    </div>
  );
}

export default App;
