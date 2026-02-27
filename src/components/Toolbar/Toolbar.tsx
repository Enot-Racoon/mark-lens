import React, { useCallback } from "react";
import { useEditorStore } from "../../stores";
import "./Toolbar.css";

export const Toolbar: React.FC = () => {
  const {
    currentFile,
    isModified,
    viewMode,
    setViewMode,
    saveFile,
    saveFileAs,
  } = useEditorStore();

  const handleSave = useCallback(async () => {
    await saveFile();
  }, [saveFile]);

  const handleSaveAs = useCallback(async () => {
    await saveFileAs();
  }, [saveFileAs]);

  const handleViewModeChange = useCallback(
    (mode: "edit" | "preview" | "split") => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  return (
    <header className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-title">Mark Lens</span>
        {currentFile && (
          <span className="toolbar-file">
            {currentFile.name}
            {isModified && <span className="toolbar-modified">*</span>}
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
            <button className="toolbar-btn" onClick={handleSave} title="Save">
              Save
            </button>
            <button className="toolbar-btn" onClick={handleSaveAs} title="Save As">
              Save As
            </button>
          </>
        )}
      </div>
    </header>
  );
};
