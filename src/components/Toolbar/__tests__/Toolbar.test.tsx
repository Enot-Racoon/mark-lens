import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "../Toolbar";
import { useEditorStore, useRecentFilesStore } from "../../../stores";

const mockLoadRecentFiles = vi.fn();

vi.mock("../../../stores", () => ({
  useEditorStore: vi.fn(),
  useRecentFilesStore: Object.assign(
    vi.fn(() => ({
      recentFiles: [],
      loadRecentFiles: mockLoadRecentFiles,
    })),
    {
      getState: vi.fn(() => ({
        loadRecentFiles: mockLoadRecentFiles,
      })),
    }
  ),
}));

describe("Toolbar", () => {
  const mockSetViewMode = vi.fn();
  const mockSaveFile = vi.fn();
  const mockSaveFileAs = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: null,
      isModified: false,
      viewMode: "split",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });
    (useRecentFilesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      recentFiles: [],
      loadRecentFiles: mockLoadRecentFiles,
    });
  });

  it("should render the app title", () => {
    render(<Toolbar />);
    expect(screen.getByText("Mark Lens")).toBeInTheDocument();
  });

  it("should render view mode toggle buttons", () => {
    render(<Toolbar />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Split")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("should highlight active view mode", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: null,
      isModified: false,
      viewMode: "edit",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });

    render(<Toolbar />);
    const editBtn = screen.getByText("Edit");
    expect(editBtn).toHaveClass("toolbar-toggle-btn-active");
  });

  it("should call setViewMode when clicking view mode buttons", async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByText("Edit"));
    expect(mockSetViewMode).toHaveBeenCalledWith("edit");

    await user.click(screen.getByText("Preview"));
    expect(mockSetViewMode).toHaveBeenCalledWith("preview");

    await user.click(screen.getByText("Split"));
    expect(mockSetViewMode).toHaveBeenCalledWith("split");
  });

  it("should not show save buttons when no file is open", () => {
    render(<Toolbar />);
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.queryByText("Save As")).not.toBeInTheDocument();
  });

  it("should show save buttons when a file is open", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Test",
      },
      isModified: false,
      viewMode: "split",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });

    render(<Toolbar />);
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Save As")).toBeInTheDocument();
  });

  it("should show file name when a file is open", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Test",
      },
      isModified: false,
      viewMode: "split",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });

    render(<Toolbar />);
    expect(screen.getByText("test.md")).toBeInTheDocument();
  });

  it("should show modified indicator when file is modified", () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Test",
      },
      isModified: true,
      viewMode: "split",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });

    render(<Toolbar />);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveClass("toolbar-modified");
  });

  it("should call saveFile when clicking Save button", async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Test",
      },
      isModified: false,
      viewMode: "split",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });

    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByText("Save"));
    expect(mockSaveFile).toHaveBeenCalled();
  });

  it("should call saveFileAs when clicking Save As button", async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentFile: {
        id: "1",
        path: "/test.md",
        name: "test.md",
        content: "# Test",
      },
      isModified: false,
      viewMode: "split",
      setViewMode: mockSetViewMode,
      saveFile: mockSaveFile,
      saveFileAs: mockSaveFileAs,
    });

    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByText("Save As"));
    expect(mockSaveFileAs).toHaveBeenCalled();
  });
});
