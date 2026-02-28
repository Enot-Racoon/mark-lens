import React, { useCallback, useMemo, useState } from "react";
import { useEditorStore } from "../../stores";
import { parseMarkdown, sanitizeHtml } from "../../lib/markdown";
import "./MarkdownEditor.css";

export const MarkdownEditor: React.FC = () => {
  const { currentFile, setContent, viewMode, splitRatio, setSplitRatio } = useEditorStore();
  const [isResizing, setIsResizing] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    [setContent]
  );

  const previewHtml = useMemo(() => {
    if (!currentFile) return "";
    const rawHtml = parseMarkdown(currentFile.content);
    return sanitizeHtml(rawHtml);
  }, [currentFile]);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const container = document.querySelector(".markdown-editor-split");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(newRatio);
    },
    [isResizing, setSplitRatio]
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

  if (!currentFile) {
    return (
      <div className="markdown-editor-empty">
        <p>No file open</p>
        <p className="hint">Open a markdown file to start editing</p>
      </div>
    );
  }

  const showEditor = viewMode === "edit" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  if (viewMode === "split") {
    return (
      <div className={`markdown-editor markdown-editor-${viewMode}`}>
        <div
          className="markdown-editor-pane"
          style={{ flex: `0 0 ${splitRatio * 100}%` }}
        >
          <textarea
            className="markdown-editor-textarea"
            value={currentFile.content}
            onChange={handleChange}
            placeholder="Write your markdown here..."
            spellCheck={false}
          />
        </div>
        <div
          className="markdown-editor-resize-handle"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />
        <div
          className="markdown-editor-pane markdown-editor-preview"
          style={{ flex: `1 1 ${(1 - splitRatio) * 100}%` }}
        >
          <div
            className="markdown-editor-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`markdown-editor markdown-editor-${viewMode}`}>
      {showEditor && (
        <div className="markdown-editor-pane">
          <textarea
            className="markdown-editor-textarea"
            value={currentFile.content}
            onChange={handleChange}
            placeholder="Write your markdown here..."
            spellCheck={false}
          />
        </div>
      )}
      {showPreview && (
        <div className="markdown-editor-pane markdown-editor-preview">
          <div
            className="markdown-editor-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}
    </div>
  );
};
