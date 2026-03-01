mod fs;

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, Submenu},
    AppHandle, Emitter, Manager, State, WebviewWindow, WindowEvent,
};
use tauri_plugin_dialog::DialogExt;

const MAX_RECENT_FILES: usize = 10;
const MARKDOWN_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "mkd", "mkdn"];

// ============================================================================
// State
// ============================================================================

/// State for files opened at startup
pub struct StartupFiles {
    pub paths: Mutex<Vec<String>>,
}

impl Default for StartupFiles {
    fn default() -> Self {
        Self {
            paths: Mutex::new(Vec::new()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RecentFile {
    path: String,
    name: String,
    last_opened: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct RecentFilesState {
    files: Vec<RecentFile>,
}

// ============================================================================
// Commands
// ============================================================================

/// Returns the list of recently opened files.
#[tauri::command]
fn get_recent_files(app: AppHandle) -> Vec<RecentFile> {
    let state = app.state::<tokio::sync::Mutex<RecentFilesState>>();
    let guard = state.blocking_lock();
    guard.files.clone()
}

/// Adds a file to the recent files list and saves it to disk.
///
/// If the file already exists in the list, it is moved to the top.
/// The list is limited to [`MAX_RECENT_FILES`] entries.
#[tauri::command]
fn add_recent_file(app: AppHandle, path: String, name: String) {
    let binding = app.state::<tokio::sync::Mutex<RecentFilesState>>();
    let mut state = binding.blocking_lock();

    // Remove if already exists
    state.files.retain(|f| f.path != path);

    // Add to front
    state.files.insert(
        0,
        RecentFile {
            path,
            name,
            last_opened: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        },
    );

    // Limit size
    if state.files.len() > MAX_RECENT_FILES {
        state.files.truncate(MAX_RECENT_FILES);
    }

    save_recent_files(&app, &state);
}

/// Clears the recent files list and saves the empty state to disk.
#[tauri::command]
fn clear_recent_files(app: AppHandle) {
    let binding = app.state::<tokio::sync::Mutex<RecentFilesState>>();
    let mut state = binding.blocking_lock();
    state.files.clear();
    save_recent_files(&app, &state);
}

/// Opens a file in the system's default editor for its file type.
#[tauri::command]
fn open_in_default_editor(path: String) -> Result<(), String> {
    opener::open(&path).map_err(|e| e.to_string())
}

/// Returns the list of files passed at application startup.
#[tauri::command]
fn get_startup_files(state: State<StartupFiles>) -> Vec<String> {
    state.paths.lock().unwrap().clone()
}

/// Clears the list of startup files.
#[tauri::command]
fn clear_startup_files(state: State<StartupFiles>) {
    let mut paths = state.paths.lock().unwrap();
    paths.clear();
}

/// Sets the title of the main window.
#[tauri::command]
fn set_window_title(app: AppHandle, title: String) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title(&title);
    }
}

/// Adds a file path to the startup files list if it's not already present.
#[tauri::command]
fn add_to_startup_files(app: AppHandle, path: String) {
    let startup_files = app.state::<StartupFiles>();
    let mut paths = startup_files.paths.lock().unwrap();
    if !paths.contains(&path) {
        paths.push(path.clone());
    }
    let _ = app.clone().emit("add_to_startup_files", &path);
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Saves the recent files state to disk as JSON.
///
/// The file is stored in the application's data directory as `recent_files.json`.
fn save_recent_files(app: &AppHandle, state: &RecentFilesState) {
    if let Some(app_dir) = app.path().app_data_dir().ok() {
        std::fs::create_dir_all(&app_dir).ok();
        let state_path = app_dir.join("recent_files.json");
        if let Ok(json) = serde_json::to_string_pretty(state) {
            std::fs::write(state_path, json).ok();
        }
    }
}

/// Loads the recent files state from disk.
///
/// Returns the default empty state if the file doesn't exist or is invalid.
fn load_recent_files(app: &AppHandle) -> RecentFilesState {
    if let Some(app_dir) = app.path().app_data_dir().ok() {
        let state_path = app_dir.join("recent_files.json");
        if let Ok(content) = std::fs::read_to_string(state_path) {
            if let Ok(state) = serde_json::from_str(&content) {
                return state;
            }
        }
    }
    RecentFilesState::default()
}

/// Checks if a file path has a Markdown extension.
fn is_markdown_file(path: &str) -> bool {
    std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .is_some_and(|ext| MARKDOWN_EXTENSIONS.contains(&ext))
}

/// Extracts a file path from a file:// URL.
///
/// If the string is not a file:// URL, returns it unchanged.
fn extract_file_path(url: &str) -> String {
    url.strip_prefix("file://").unwrap_or(url).to_string()
}

// ============================================================================
// Menu
// ============================================================================

/// Builds the application menu bar.
///
/// On macOS, includes the app menu (About, Quit) plus File and View menus.
/// On other platforms, includes only File and View menus.
pub fn build_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let about_mi = MenuItem::with_id(app, "about", "About Mark Lens", true, None::<&str>)?;
    let quit_mi = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;
    let open_mi = MenuItem::with_id(app, "open", "Open…", true, Some("CmdOrCtrl+O"))?;
    let close_window_mi = MenuItem::with_id(
        app,
        "close_window",
        "Close Window",
        true,
        Some("CmdOrCtrl+W"),
    )?;
    let reload_mi = MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?;
    let toggle_fullscreen_mi = MenuItem::with_id(
        app,
        "toggle_fullscreen",
        "Toggle Full Screen",
        true,
        Some("Ctrl+Cmd+F"),
    )?;

    let file_menu = Submenu::with_items(app, "File", true, &[&open_mi, &close_window_mi])?;
    let view_menu = Submenu::with_items(app, "View", true, &[&reload_mi, &toggle_fullscreen_mi])?;

    #[cfg(target_os = "macos")]
    {
        let app_menu = Submenu::with_items(app, "Mark Lens", true, &[&about_mi, &quit_mi])?;
        return Menu::with_items(app, &[&app_menu, &file_menu, &view_menu]);
    }

    #[cfg(not(target_os = "macos"))]
    {
        Menu::with_items(app, &[&file_menu, &view_menu])
    }
}

// ============================================================================
// Event Handlers
// ============================================================================

/// Sets up window event handlers for drag-and-drop support.
///
/// When files are dropped onto the window, they are added to the startup files list.
fn setup_window_event_handlers(window: &WebviewWindow, app_handle: AppHandle) {
    let app_handle = app_handle.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, .. }) = event {
            for path in paths {
                println!("[App] Dragged file: {}", path.to_string_lossy());
                add_to_startup_files(app_handle.clone(), path.to_string_lossy().to_string());
            }
        }
    });
}

/// Sets up menu event handlers for all menu items.
///
/// Handles: About, Quit, Open, Clear Recent, Close Window, Reload, Toggle Full Screen.
fn setup_menu_events(app: &AppHandle) {
    app.on_menu_event(move |app, event| match event.id.as_ref() {
        "about" => handle_about_event(app),
        "quit" => std::process::exit(0),
        "open" => handle_open_event(app),
        "clear_recent" => {
            clear_recent_files(app.clone());
            let _ = app.emit("recent-files-changed", ());
        }
        "close_window" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.close();
            }
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.dispatchEvent(new CustomEvent('reload-file'))");
            }
        }
        "toggle_fullscreen" => {
            if let Some(window) = app.get_webview_window("main") {
                let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                let _ = window.set_fullscreen(!is_fullscreen);
            }
        }
        _ => {}
    });
}

/// Shows the About dialog with application information.
fn handle_about_event(app: &AppHandle) {
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        app_handle
            .dialog()
            .message("Mark Lens\n\nA cross-platform Markdown viewer and editor.\n\n© 2024 Alexey Karasev")
            .title("About Mark Lens")
            .show(|_| {});
    });
}

/// Opens a file picker dialog to select a Markdown file.
///
/// On file selection, emits a `file-open-requested` event and adds the file to recent files.
fn handle_open_event(app: &AppHandle) {
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        app_handle
            .dialog()
            .file()
            .add_filter("Markdown", MARKDOWN_EXTENSIONS)
            .pick_file(move |file| {
                if let Some(file_path) = file {
                    let path = file_path.to_string();
                    let name = std::path::Path::new(&path)
                        .file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();
                    let _ = app_handle.emit("file-open-requested", &path);
                    add_recent_file(app_handle.clone(), path, name);
                }
            });
    });
}

/// Processes command-line arguments and adds Markdown files to the startup list.
fn process_startup_files(app_handle: &AppHandle, args: &[String]) {
    for path in args.iter().filter(|p| is_markdown_file(p)) {
        eprintln!("[setup] Storing startup file: {}", path);
        add_to_startup_files(app_handle.clone(), path.clone());
    }
}

/// Handles file open events when the app is already running.
///
/// This is triggered when a user opens a file via Finder (macOS) or File Explorer (Windows/Linux)
/// while the application is already running.
fn handle_opened_urls(app_handle: &AppHandle, urls: Vec<tauri::Url>) {
    eprintln!("[RunEvent::Opened] Received {} file(s)", urls.len());

    for url in urls {
        let url_str = url.to_string();
        eprintln!("[RunEvent::Opened] File URL: {}", url_str);
        let path = extract_file_path(&url_str);
        add_to_startup_files(app_handle.clone(), path);
    }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/// Runs the Tauri application.
///
/// Initializes plugins, registers commands, sets up state management,
/// and configures event handlers for the application lifecycle.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(tokio::sync::Mutex::new(RecentFilesState::default()))
        .manage(StartupFiles::default())
        .invoke_handler(tauri::generate_handler![
            get_recent_files,
            add_recent_file,
            clear_recent_files,
            open_in_default_editor,
            get_startup_files,
            clear_startup_files,
            add_to_startup_files,
            set_window_title,
            fs::read_file,
            fs::write_file,
            fs::file_exists,
            fs::check_access,
            fs::list_dir,
            fs::get_file_metadata,
            fs::create_dir,
            fs::delete_path,
            fs::rename_path,
            fs::copy_file,
        ])
        .setup(|app| {
            eprintln!("[setup] Application starting up...");

            let window = app.get_webview_window("main").unwrap();
            let app_handle = app.handle().clone();

            // Setup event handlers
            setup_window_event_handlers(&window, app_handle.clone());
            setup_menu_events(&app_handle);

            // Load recent files from disk
            let recent_files = load_recent_files(&app_handle);
            *app.state::<tokio::sync::Mutex<RecentFilesState>>()
                .blocking_lock() = recent_files.clone();
            eprintln!("[setup] Loaded {} recent files", recent_files.files.len());

            // Set up menu
            let menu = build_menu(&app_handle)?;
            app.set_menu(menu)?;

            // Handle files opened via command line arguments (first launch)
            let args: Vec<String> = std::env::args().skip(1).collect();
            eprintln!("[setup] Command line args: {:?}", args);
            process_startup_files(&app_handle, &args);

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            // Handle file open events (when app is already running)
            // RunEvent::Opened is only available on macOS
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = event {
                handle_opened_urls(&app_handle, urls);
            }
        });
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // is_markdown_file tests
    // ========================================================================

    #[test]
    fn test_is_markdown_file_with_md_extension() {
        assert!(is_markdown_file("README.md"));
        assert!(is_markdown_file("notes.md"));
        assert!(is_markdown_file("/path/to/file.md"));
    }

    #[test]
    fn test_is_markdown_file_with_markdown_extension() {
        assert!(is_markdown_file("file.markdown"));
        assert!(is_markdown_file("/path/to/file.markdown"));
    }

    #[test]
    fn test_is_markdown_file_with_mdown_extension() {
        assert!(is_markdown_file("file.mdown"));
    }

    #[test]
    fn test_is_markdown_file_with_mkd_extension() {
        assert!(is_markdown_file("file.mkd"));
    }

    #[test]
    fn test_is_markdown_file_with_mkdn_extension() {
        assert!(is_markdown_file("file.mkdn"));
    }

    #[test]
    fn test_is_markdown_file_case_sensitive() {
        // Extensions are case-sensitive on Unix-like systems
        assert!(!is_markdown_file("file.MD"));
        assert!(!is_markdown_file("file.Md"));
    }

    #[test]
    fn test_is_markdown_file_non_markdown() {
        assert!(!is_markdown_file("file.txt"));
        assert!(!is_markdown_file("file.rs"));
        assert!(!is_markdown_file("file.json"));
        assert!(!is_markdown_file("file.md.bak"));
    }

    #[test]
    fn test_is_markdown_file_no_extension() {
        assert!(!is_markdown_file("README"));
        assert!(!is_markdown_file("file"));
    }

    #[test]
    fn test_is_markdown_file_empty_string() {
        assert!(!is_markdown_file(""));
    }

    // ========================================================================
    // extract_file_path tests
    // ========================================================================

    #[test]
    fn test_extract_file_path_with_file_protocol() {
        assert_eq!(
            extract_file_path("file:///path/to/file.md"),
            "/path/to/file.md"
        );
        assert_eq!(
            extract_file_path("file:///Users/test/document.md"),
            "/Users/test/document.md"
        );
    }

    #[test]
    fn test_extract_file_path_without_file_protocol() {
        assert_eq!(extract_file_path("/path/to/file.md"), "/path/to/file.md");
        assert_eq!(extract_file_path("relative/path.md"), "relative/path.md");
    }

    #[test]
    fn test_extract_file_path_partial_protocol() {
        // Edge case: string starts with "file://" but has more content
        assert_eq!(extract_file_path("file://test.md"), "test.md");
    }

    #[test]
    fn test_extract_file_path_empty_string() {
        assert_eq!(extract_file_path(""), "");
    }

    // ========================================================================
    // RecentFile tests
    // ========================================================================

    #[test]
    fn test_recent_file_serialization() {
        let file = RecentFile {
            path: "/path/to/file.md".to_string(),
            name: "file.md".to_string(),
            last_opened: 1234567890,
        };

        let json = serde_json::to_string(&file).unwrap();
        let deserialized: RecentFile = serde_json::from_str(&json).unwrap();

        assert_eq!(file.path, deserialized.path);
        assert_eq!(file.name, deserialized.name);
        assert_eq!(file.last_opened, deserialized.last_opened);
    }

    // ========================================================================
    // RecentFilesState tests
    // ========================================================================

    #[test]
    fn test_recent_files_state_default() {
        let state = RecentFilesState::default();
        assert!(state.files.is_empty());
    }

    #[test]
    fn test_recent_files_state_serialization() {
        let state = RecentFilesState {
            files: vec![
                RecentFile {
                    path: "/path/to/file1.md".to_string(),
                    name: "file1.md".to_string(),
                    last_opened: 1234567890,
                },
                RecentFile {
                    path: "/path/to/file2.md".to_string(),
                    name: "file2.md".to_string(),
                    last_opened: 1234567891,
                },
            ],
        };

        let json = serde_json::to_string_pretty(&state).unwrap();
        let deserialized: RecentFilesState = serde_json::from_str(&json).unwrap();

        assert_eq!(state.files.len(), deserialized.files.len());
        assert_eq!(state.files[0].path, deserialized.files[0].path);
        assert_eq!(state.files[1].name, deserialized.files[1].name);
    }

    // ========================================================================
    // StartupFiles tests
    // ========================================================================

    #[test]
    fn test_startup_files_default() {
        let startup_files = StartupFiles::default();
        let paths = startup_files.paths.lock().unwrap();
        assert!(paths.is_empty());
    }

    #[test]
    fn test_startup_files_add_and_retrieve() {
        let startup_files = StartupFiles::default();
        {
            let mut paths = startup_files.paths.lock().unwrap();
            paths.push("/path/to/file1.md".to_string());
            paths.push("/path/to/file2.md".to_string());
        }

        let paths = startup_files.paths.lock().unwrap();
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], "/path/to/file1.md");
        assert_eq!(paths[1], "/path/to/file2.md");
    }
}
