# Mark Lens

A cross-platform desktop Markdown viewer and editor built with Tauri, React, and TypeScript.

## Features

- **Live Preview**: Edit Markdown with real-time preview
- **Multiple View Modes**: Switch between editor, preview, or split view
- **File Management**: Open and save Markdown files
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Dark Theme**: Easy on the eyes with a modern dark UI
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + S` - Save file
  - `Ctrl/Cmd + Shift + S` - Save As

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Desktop Framework**: Tauri 2
- **State Management**: Zustand
- **Markdown Parsing**: marked
- **Testing**: Vitest, React Testing Library

## Project Structure

```
mark-lens/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── MarkdownEditor/   # Editor and preview pane
│   │   ├── Sidebar/          # File sidebar
│   │   └── Toolbar/          # Top toolbar
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── stores/               # Zustand state stores
│   ├── test/                 # Test setup
│   ├── types/                # TypeScript types
│   └── App.tsx               # Main application
├── src-tauri/                # Tauri/Rust backend
│   ├── src/
│   │   ├── lib.rs            # Rust library entry point
│   │   └── main.rs           # Rust application entry
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Rust 1.70+ (install via [rustup](https://rustup.rs/))
- macOS: Xcode Command Line Tools
- Windows: Visual Studio C++ Build Tools
- Linux: `libwebkit2gtk`, `libgtk-3`, `libayatana-appindicator3` (or equivalent)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mark-lens.git
cd mark-lens
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri dev
```

### Building for Production

```bash
npm run tauri build
```

This will create distributable packages in `src-tauri/target/release/bundle/`.

## Development

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once
npm run test:run
```

### Code Style

The project uses strict TypeScript configuration with:
- No unused locals or parameters
- No fallthrough cases in switch statements
- Strict null checks

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run tauri` | Tauri CLI commands |
| `npm run tauri dev` | Run app in development mode |
| `npm run tauri build` | Build app for production |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage report |

## License

MIT
