import { Toolbar, Sidebar, MarkdownEditor } from "./components";
import { useKeyboardShortcuts } from "./hooks";
import "./App.css";

function App() {
  useKeyboardShortcuts();

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
