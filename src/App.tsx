import { useEffect } from "react";
import { Toolbar, Sidebar, MarkdownEditor } from "./components";
import { useEditorStore, useRecentFilesStore } from "./stores";
import { useDragAndDrop } from "./hooks";
import "./App.css";

function App() {
  const setupFileWatcher = useEditorStore((state) => state.setupFileWatcher);
  const loadRecentFiles = useRecentFilesStore((state) => state.loadRecentFiles);

  useEffect(() => {
    setupFileWatcher();
    loadRecentFiles();
  }, [setupFileWatcher, loadRecentFiles]);

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
