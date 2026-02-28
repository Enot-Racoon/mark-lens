import React, { useCallback, useState } from "react";
import { useEditorStore, useRecentFilesStore } from "../../stores";
import "./Sidebar.css";

export const Sidebar: React.FC = () => {
  const {
    files,
    currentFile,
    setCurrentFile,
    removeFile,
    openFile,
    sidebarWidth,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarWidth,
  } = useEditorStore();
  const { recentFiles, clearRecentFiles } = useRecentFilesStore();
  const [showRecentMenu, setShowRecentMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleOpenFile = useCallback(async () => {
    await openFile();
  }, [openFile]);

  const handleSelectFile = useCallback(
    (file: (typeof files)[0]) => {
      setCurrentFile(file);
    },
    [setCurrentFile],
  );

  const handleCloseFile = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeFile(id);
    },
    [removeFile],
  );

  const handleOpenRecent = useCallback(async (path: string) => {
    await useEditorStore.getState().openFileByPath(path);
    setShowRecentMenu(false);
  }, []);

  const handleClearRecent = useCallback(async () => {
    await clearRecentFiles();
    setShowRecentMenu(false);
  }, [clearRecentFiles]);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      setSidebarWidth(newWidth);
    },
    [isResizing, setSidebarWidth],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
      if (isResizing) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  if (sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar-collapsed">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title="Expand sidebar"
        >
          ▶
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="sidebar" style={{ width: sidebarWidth }}>
        <div className="sidebar-header">
          <button
            className="sidebar-btn sidebar-btn-toggle"
            onClick={toggleSidebar}
            title="Collapse sidebar"
          >
            ◀
          </button>
          <h2 className="sidebar-title">Files</h2>
          <div className="sidebar-header-actions">
            <button
              className="sidebar-btn sidebar-btn-primary"
              onClick={handleOpenFile}
            >
              Open
            </button>
            <div className="sidebar-dropdown">
              <button
                className="sidebar-btn sidebar-btn-dropdown"
                onClick={() => setShowRecentMenu(!showRecentMenu)}
                title="Open Recent"
              >
                ▾
              </button>
              {showRecentMenu && (
                <div className="sidebar-dropdown-menu">
                  {recentFiles.length === 0 ? (
                    <div className="sidebar-dropdown-empty">
                      No recent files
                    </div>
                  ) : (
                    <>
                      <ul className="recent-files-list">
                        {recentFiles.map((file) => (
                          <li
                            key={file.path}
                            className="recent-file-item"
                            onClick={() => handleOpenRecent(file.path)}
                            title={file.path}
                          >
                            {file.name}
                          </li>
                        ))}
                      </ul>
                      <div className="sidebar-dropdown-divider" />
                      <button
                        className="sidebar-dropdown-item clear-recent"
                        onClick={handleClearRecent}
                      >
                        Clear Menu
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="sidebar-content">
          {files.length === 0 ? (
            <div className="sidebar-empty">
              <p>No files open</p>
              <p className="sidebar-hint">
                Open a markdown file to start editing
              </p>
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
        <div
          className="sidebar-resize-handle"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />
      </aside>
    </>
  );
};
