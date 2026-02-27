import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../Sidebar";
import { useEditorStore } from "../../../stores";

vi.mock("../../../stores", () => ({
  useEditorStore: vi.fn(),
}));

describe("Sidebar", () => {
  const mockSetCurrentFile = vi.fn();
  const mockRemoveFile = vi.fn();
  const mockOpenFile = vi.fn();

  const mockFiles = [
    {
      id: "1",
      path: "/test1.md",
      name: "test1.md",
      content: "# Test 1",
    },
    {
      id: "2",
      path: "/test2.md",
      name: "test2.md",
      content: "# Test 2",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: [],
      currentFile: null,
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });
  });

  it("should render the sidebar title", () => {
    render(<Sidebar />);
    expect(screen.getByText("Files")).toBeInTheDocument();
  });

  it("should render the Open button", () => {
    render(<Sidebar />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("should show empty state when no files are open", () => {
    render(<Sidebar />);
    expect(screen.getByText("No files open")).toBeInTheDocument();
  });

  it("should call openFile when clicking Open button", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText("Open"));
    expect(mockOpenFile).toHaveBeenCalled();
  });

  it("should render file list when files are open", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: mockFiles,
      currentFile: null,
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });

    render(<Sidebar />);
    expect(screen.getByText("test1.md")).toBeInTheDocument();
    expect(screen.getByText("test2.md")).toBeInTheDocument();
  });

  it("should call setCurrentFile when clicking on a file", async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: mockFiles,
      currentFile: null,
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });

    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText("test1.md"));
    expect(mockSetCurrentFile).toHaveBeenCalledWith(mockFiles[0]);
  });

  it("should highlight the current file", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: mockFiles,
      currentFile: mockFiles[0],
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });

    render(<Sidebar />);
    const activeFile = screen.getByText("test1.md").closest("li");
    expect(activeFile).toHaveClass("file-item-active");
  });

  it("should show close button on file hover", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: mockFiles,
      currentFile: null,
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });

    render(<Sidebar />);
    const closeButtons = screen.getAllByTitle("Close file");
    expect(closeButtons).toHaveLength(2);
  });

  it("should call removeFile when clicking close button", async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: mockFiles,
      currentFile: null,
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });

    const user = userEvent.setup();
    render(<Sidebar />);

    const closeButtons = screen.getAllByTitle("Close file");
    await user.click(closeButtons[0]);
    expect(mockRemoveFile).toHaveBeenCalledWith(mockFiles[0].id);
  });

  it("should not propagate click when closing file", async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      files: mockFiles,
      currentFile: null,
      setCurrentFile: mockSetCurrentFile,
      removeFile: mockRemoveFile,
      openFile: mockOpenFile,
    });

    const user = userEvent.setup();
    render(<Sidebar />);

    const closeButtons = screen.getAllByTitle("Close file");
    await user.click(closeButtons[0]);
    
    // setCurrentFile should not be called when clicking close button
    expect(mockSetCurrentFile).not.toHaveBeenCalled();
    expect(mockRemoveFile).toHaveBeenCalledWith(mockFiles[0].id);
  });
});
