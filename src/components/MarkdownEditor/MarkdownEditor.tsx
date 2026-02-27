import React, { useCallback, useMemo } from "react";
import { useEditorStore } from "../../stores";
import { parseMarkdown, sanitizeHtml } from "../../lib/markdown";
import "./MarkdownEditor.css";

export const MarkdownEditor: React.FC = () => {
  const { currentFile, setContent, viewMode } = useEditorStore();

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
