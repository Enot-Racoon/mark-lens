import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

import "./App.css";
import { Toolbar, Sidebar, MarkdownEditor } from "./components";
import { useEditorStore, useRecentFilesStore } from "./stores";

function App() {
  const setupFileWatcher = useEditorStore((state) => state.setupFileWatcher);
  const loadRecentFiles = useRecentFilesStore((state) => state.loadRecentFiles);
  const openFileByPath = useEditorStore((state) => state.openFileByPath);
  const openStartupFiles = useEditorStore((state) => state.openStartupFiles);

  useEffect(() => {
    setupFileWatcher();
    loadRecentFiles();
    openStartupFiles();

    const unlisten = listen("add_to_startup_files", (event) => {
      // why not work?
      console.log("[App] Adding file to startup:", event.payload);
      openStartupFiles();
    });

    return () => {
      unlisten.then((unsub) => unsub());
    };
  }, [setupFileWatcher, loadRecentFiles, openFileByPath]);

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
