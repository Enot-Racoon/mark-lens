import { useEffect } from "react";
import { Toolbar, Sidebar, MarkdownEditor } from "./components";
import { useEditorStore } from "./stores";
import { useDragAndDrop } from "./hooks";
import "./App.css";

function App() {
  const setupFileWatcher = useEditorStore((state) => state.setupFileWatcher);

  useEffect(() => {
    setupFileWatcher();
  }, [setupFileWatcher]);

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
