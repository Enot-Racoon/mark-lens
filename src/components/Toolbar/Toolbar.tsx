import React, { useCallback, useEffect } from "react";
import { useEditorStore, useRecentFilesStore } from "../../stores";
import "./Toolbar.css";

export const Toolbar: React.FC = () => {
  const {
    currentFile,
    isModified,
    viewMode,
    setViewMode,
    saveFile,
    saveFileAs,
    openFile,
    reloadFile,
  } = useEditorStore();

  useEffect(() => {
    useRecentFilesStore.getState().loadRecentFiles();
  }, []);

  const handleSave = useCallback(async () => {
    await saveFile();
  }, [saveFile]);

  const handleSaveAs = useCallback(async () => {
    await saveFileAs();
  }, [saveFileAs]);

  const handleOpen = useCallback(async () => {
    await openFile();
  }, [openFile]);

  const handleReload = useCallback(async () => {
    await reloadFile();
  }, [reloadFile]);

  const handleViewModeChange = useCallback(
    (mode: "edit" | "preview" | "split") => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  const handleToggleFullscreen = useCallback(() => {
    // Use Tauri window API for fullscreen
    import("@tauri-apps/api/webviewWindow").then(({ WebviewWindow }) => {
      const window = WebviewWindow.getCurrent();
      window.isFullscreen().then((isFullscreen) => {
        window.setFullscreen(!isFullscreen);
      });
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === "o") {
        e.preventDefault();
        handleOpen();
      } else if (modKey && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if (modKey && e.key === "r") {
        e.preventDefault();
        handleReload();
      } else if (modKey && e.key === "f") {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs, handleReload, handleToggleFullscreen]);

  return (
    <header className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-title">Mark Lens</span>
        {currentFile && (
          <span className="toolbar-file" title={currentFile.path}>
            <span className="toolbar-file-name">{currentFile.name}</span>
            {isModified && <span className="toolbar-modified">*</span>}
            <span className="toolbar-file-path">{currentFile.path}</span>
          </span>
        )}
      </div>
      <div className="toolbar-section toolbar-section-center">
        <div className="toolbar-toggle-group">
          <button
            className={`toolbar-toggle-btn ${viewMode === "edit" ? "toolbar-toggle-btn-active" : ""}`}
            onClick={() => handleViewModeChange("edit")}
            title="Editor only"
          >
            Edit
          </button>
          <button
            className={`toolbar-toggle-btn ${viewMode === "split" ? "toolbar-toggle-btn-active" : ""}`}
            onClick={() => handleViewModeChange("split")}
            title="Split view"
          >
            Split
          </button>
          <button
            className={`toolbar-toggle-btn ${viewMode === "preview" ? "toolbar-toggle-btn-active" : ""}`}
            onClick={() => handleViewModeChange("preview")}
            title="Preview only"
          >
            Preview
          </button>
        </div>
      </div>
      <div className="toolbar-section toolbar-section-right">
        {currentFile && (
          <>
            <button className="toolbar-btn" onClick={handleReload} title="Reload (Ctrl+R)">
              Reload
            </button>
            <button className="toolbar-btn" onClick={handleSave} title="Save (Ctrl+S)">
              Save
            </button>
            <button className="toolbar-btn" onClick={handleSaveAs} title="Save As (Ctrl+Shift+S)">
              Save As
            </button>
          </>
        )}
      </div>
    </header>
  );
};
