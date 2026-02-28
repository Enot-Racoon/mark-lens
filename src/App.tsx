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
    <div className="app">
      <Toolbar />
      <div className="app-body">
        <Sidebar />
        <MarkdownEditor />
      </div>
    </div>
  );
}

export default App;
