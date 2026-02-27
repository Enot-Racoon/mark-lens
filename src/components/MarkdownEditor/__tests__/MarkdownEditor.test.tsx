import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../MarkdownEditor";
import { useEditorStore } from "../../../stores";

vi.mock("../../../stores", () => ({
  useEditorStore: vi.fn(),
}));

describe("MarkdownEditor", () => {
  const mockSetContent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show empty state when no file is open", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: null,
      viewMode: "split",
      setContent: mockSetContent,
    });

    render(<MarkdownEditor />);
    expect(screen.getByText("No file open")).toBeInTheDocument();
    expect(screen.getByText("Open a markdown file to start editing")).toBeInTheDocument();
  });

  it("should render textarea in edit mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "edit",
      setContent: mockSetContent,
    });

    render(<MarkdownEditor />);
    const textarea = screen.getByPlaceholderText("Write your markdown here...");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("# Hello World");
  });

  it("should call setContent when typing in textarea", async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello",
      },
      viewMode: "edit",
      setContent: mockSetContent,
    });

    const user = userEvent.setup();
    render(<MarkdownEditor />);

    const textarea = screen.getByPlaceholderText("Write your markdown here...");
    await user.clear(textarea);
    await user.type(textarea, "# New Content");
    
    expect(mockSetContent).toHaveBeenCalled();
  });

  it("should render preview in preview mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "preview",
      setContent: mockSetContent,
    });

    render(<MarkdownEditor />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should render both editor and preview in split mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "split",
      setContent: mockSetContent,
    });

    render(<MarkdownEditor />);
    expect(screen.getByPlaceholderText("Write your markdown here...")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should have correct CSS class for split mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "split",
      setContent: mockSetContent,
    });

    const { container } = render(<MarkdownEditor />);
    expect(container.querySelector(".markdown-editor-split")).toBeInTheDocument();
  });

  it("should have correct CSS class for edit mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "edit",
      setContent: mockSetContent,
    });

    const { container } = render(<MarkdownEditor />);
    expect(container.querySelector(".markdown-editor-edit")).toBeInTheDocument();
  });

  it("should have correct CSS class for preview mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "preview",
      setContent: mockSetContent,
    });

    const { container } = render(<MarkdownEditor />);
    expect(container.querySelector(".markdown-editor-preview")).toBeInTheDocument();
  });

  it("should not show textarea in preview mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "preview",
      setContent: mockSetContent,
    });

    render(<MarkdownEditor />);
    expect(screen.queryByPlaceholderText("Write your markdown here...")).not.toBeInTheDocument();
  });

  it("should not show preview in edit mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Hello World",
      },
      viewMode: "edit",
      setContent: mockSetContent,
    });

    render(<MarkdownEditor />);
    const previewPane = document.querySelector(".markdown-editor-preview");
    expect(previewPane).not.toBeInTheDocument();
  });
});
