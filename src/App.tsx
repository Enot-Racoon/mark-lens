import { useEffect } from "react";
import { Toolbar, Sidebar, MarkdownEditor } from "./components";
import { useEditorStore, useRecentFilesStore } from "./stores";
import { useDragAndDrop } from "./hooks";
import "./App.css";

function App() {
  const setupFileWatcher = useEditorStore((state) => state.setupFileWatcher);
  const loadRecentFiles = useRecentFilesStore((state) => state.loadRecentFiles);
  const openFileByPath = useEditorStore((state) => state.openFileByPath);

  useEffect(() => {
    setupFileWatcher();
    loadRecentFiles();

    // Check for pending files from global listener
    const pendingFiles = sessionStorage.getItem("pending-files");
    if (pendingFiles) {
      const files = JSON.parse(pendingFiles);
      console.log("[App] Processing pending files:", files);
      files.forEach((path: string) => {
        openFileByPath(path);
      });
      sessionStorage.removeItem("pending-files");
    }
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
