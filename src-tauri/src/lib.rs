use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, Submenu},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_dialog::DialogExt;

const MAX_RECENT_FILES: usize = 10;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RecentFile {
    path: String,
    name: String,
    last_opened: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RecentFilesState {
    files: Vec<RecentFile>,
}

impl Default for RecentFilesState {
    fn default() -> Self {
        Self { files: Vec::new() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct FileContent {
    path: String,
    content: String,
}

#[tauri::command]
fn get_recent_files(app: AppHandle) -> Vec<RecentFile> {
    let state = app.state::<tokio::sync::Mutex<RecentFilesState>>();
    let guard = state.blocking_lock();
    let files = guard.files.clone();
    drop(guard);
    files
}

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

    // Save to disk
    if let Some(app_dir) = app.path().app_data_dir().ok() {
        std::fs::create_dir_all(&app_dir).ok();
        let state_path = app_dir.join("recent_files.json");
        if let Ok(json) = serde_json::to_string_pretty(&*state) {
            std::fs::write(state_path, json).ok();
        }
    }
}

#[tauri::command]
fn clear_recent_files(app: AppHandle) {
    let binding = app.state::<tokio::sync::Mutex<RecentFilesState>>();
    let mut state = binding.blocking_lock();
    state.files.clear();

    // Save to disk
    if let Some(app_dir) = app.path().app_data_dir().ok() {
        let state_path = app_dir.join("recent_files.json");
        std::fs::write(state_path, serde_json::to_string(&*state).unwrap_or_default()).ok();
    }
}

#[tauri::command]
fn read_file_content(path: String) -> Result<FileContent, String> {
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(FileContent { path, content })
}

#[tauri::command]
fn write_file_content(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_in_default_editor(path: String) -> Result<(), String> {
    opener::open(&path).map_err(|e| e.to_string())
}

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

pub fn build_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let about_mi = MenuItem::with_id(app, "about", "About Mark Lens", true, None::<&str>)?;
    let quit_mi = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;

    let open_mi = MenuItem::with_id(app, "open", "Open…", true, Some("CmdOrCtrl+O"))?;
    let open_recent_mi = MenuItem::with_id(app, "open_recent", "Open Recent", true, None::<&str>)?;
    let clear_recent_mi =
        MenuItem::with_id(app, "clear_recent", "Clear Menu", true, None::<&str>)?;
    let close_window_mi =
        MenuItem::with_id(app, "close_window", "Close Window", true, Some("CmdOrCtrl+W"))?;

    let reload_mi = MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?;
    let toggle_fullscreen_mi = MenuItem::with_id(
        app,
        "toggle_fullscreen",
        "Toggle Full Screen",
        true,
        Some("Ctrl+Cmd+F"),
    )?;

    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &open_mi,
            &open_recent_mi,
            &clear_recent_mi,
            &close_window_mi,
        ],
    )?;
    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[&reload_mi, &toggle_fullscreen_mi],
    )?;

    #[cfg(target_os = "macos")]
    {
        let app_menu = Submenu::with_items(
            app,
            "Mark Lens",
            true,
            &[&about_mi, &quit_mi],
        )?;
        return Menu::with_items(app, &[&app_menu, &file_menu, &view_menu]);
    }

    #[cfg(not(target_os = "macos"))]
    {
        return Menu::with_items(app, &[&file_menu, &view_menu]);
    }
}

pub fn run() {
    let mut builder = tauri::Builder::default();

    builder = builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(tokio::sync::Mutex::new(RecentFilesState::default()))
        .invoke_handler(tauri::generate_handler![
            get_recent_files,
            add_recent_file,
            clear_recent_files,
            read_file_content,
            write_file_content,
            open_in_default_editor
        ])
        .setup(|app| {
            // Load recent files from disk
            let recent_files = load_recent_files(&app.handle());
            *app.state::<tokio::sync::Mutex<RecentFilesState>>()
                .blocking_lock() = recent_files;

            // Set up menu
            let menu = build_menu(&app.handle())?;
            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                let id = event.id.as_ref();
                match id {
                    "about" => {
                        let _ = app.show();
                        let app_handle = app.clone();
                        tauri::async_runtime::spawn(async move {
                            app_handle
                                .dialog()
                                .message("Mark Lens\n\nA cross-platform Markdown viewer and editor.\n\n© 2024 Alexey Karasev")
                                .title("About Mark Lens")
                                .show(|_| {});
                        });
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    "open" => {
                        let app_handle = app.clone();
                        tauri::async_runtime::spawn(async move {
                            app_handle
                                .dialog()
                                .file()
                                .add_filter("Markdown", &["md", "markdown", "mdown", "mkd", "mkdn"])
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
                }
            });

            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
