import React, { useCallback } from "react";
import { useEditorStore } from "../../stores";
import "./Sidebar.css";

export const Sidebar: React.FC = () => {
  const { files, currentFile, setCurrentFile, removeFile, openFile } = useEditorStore();

  const handleOpenFile = useCallback(async () => {
    await openFile();
  }, [openFile]);

  const handleSelectFile = useCallback(
    (file: typeof files[0]) => {
      setCurrentFile(file);
    },
    [setCurrentFile]
  );

  const handleCloseFile = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeFile(id);
    },
    [removeFile]
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Files</h2>
        <button className="sidebar-btn sidebar-btn-primary" onClick={handleOpenFile}>
          Open
        </button>
      </div>
      <div className="sidebar-content">
        {files.length === 0 ? (
          <div className="sidebar-empty">
            <p>No files open</p>
          </div>
        ) : (
          <ul className="file-list">
            {files.map((file) => (
              <li
                key={file.id}
                className={`file-item ${currentFile?.id === file.id ? "file-item-active" : ""}`}
                onClick={() => handleSelectFile(file)}
              >
                <span className="file-name">{file.name}</span>
                <button
                  className="file-close-btn"
                  onClick={(e) => handleCloseFile(e, file.id)}
                  title="Close file"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};
