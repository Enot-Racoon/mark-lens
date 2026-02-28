use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Result of reading a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadFileResult {
    pub path: String,
    pub name: String,
    pub content: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Result of writing a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteFileResult {
    pub path: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Result of checking file access
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessCheckResult {
    pub path: String,
    pub readable: bool,
    pub writable: bool,
}

/// Entry in a directory listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirEntry {
    pub path: String,
    pub name: String,
    pub is_directory: bool,
    pub size: Option<u64>,
    pub last_modified: Option<u64>,
}

/// Result of listing a directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListDirResult {
    pub path: String,
    pub entries: Vec<DirEntry>,
    pub success: bool,
    pub error: Option<String>,
}

/// Get file name from path
fn get_file_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(path)
        .to_string()
}

/// Read text file content
#[tauri::command]
pub fn read_file(path: String) -> Result<ReadFileResult, String> {
    let name = get_file_name(&path);
    
    match fs::read_to_string(&path) {
        Ok(content) => Ok(ReadFileResult {
            path,
            name,
            content,
            success: true,
            error: None,
        }),
        Err(e) => Ok(ReadFileResult {
            path,
            name,
            content: String::new(),
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

/// Write text content to file
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<WriteFileResult, String> {
    match fs::write(&path, &content) {
        Ok(()) => Ok(WriteFileResult {
            path,
            success: true,
            error: None,
        }),
        Err(e) => Ok(WriteFileResult {
            path,
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

/// Check if file exists
#[tauri::command]
pub fn file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

/// Check file access permissions
#[tauri::command]
pub fn check_access(path: String) -> Result<AccessCheckResult, String> {
    let path_ref = Path::new(&path);
    
    let readable = path_ref.exists();
    
    let writable = if path_ref.exists() {
        // Try to open for append to test write access
        std::fs::OpenOptions::new()
            .append(true)
            .open(&path)
            .is_ok()
    } else {
        // If file doesn't exist, check if parent directory is writable
        path_ref.parent()
            .map(|p| std::fs::OpenOptions::new()
                .write(true)
                .open(p)
                .is_ok())
            .unwrap_or(false)
    };
    
    Ok(AccessCheckResult {
        path,
        readable,
        writable,
    })
}

/// List directory contents
#[tauri::command]
pub fn list_dir(path: String) -> Result<ListDirResult, String> {
    let entries = match fs::read_dir(&path) {
        Ok(dir_entries) => {
            let mut result = Vec::new();
            
            for entry_result in dir_entries {
                if let Ok(entry) = entry_result {
                    let entry_path = entry.path();
                    let path_str = entry_path.to_string_lossy().to_string();
                    let name = entry
                        .file_name()
                        .to_string_lossy()
                        .to_string();
                    
                    let is_directory = entry.path().is_dir();
                    let size = if is_directory {
                        None
                    } else {
                        entry.metadata().map(|m| m.len()).ok()
                    };
                    
                    let last_modified = entry
                        .metadata()
                        .and_then(|m| m.modified())
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs());
                    
                    result.push(DirEntry {
                        path: path_str,
                        name,
                        is_directory,
                        size,
                        last_modified,
                    });
                }
            }
            
            result
        }
        Err(e) => {
            return Ok(ListDirResult {
                path,
                entries: Vec::new(),
                success: false,
                error: Some(e.to_string()),
            });
        }
    };
    
    Ok(ListDirResult {
        path,
        entries,
        success: true,
        error: None,
    })
}

/// Get file metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub path: String,
    pub exists: bool,
    pub is_file: bool,
    pub is_directory: bool,
    pub size: Option<u64>,
    pub last_modified: Option<u64>,
}

#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let path_ref = Path::new(&path);
    let exists = path_ref.exists();
    
    if !exists {
        return Ok(FileMetadata {
            path,
            exists: false,
            is_file: false,
            is_directory: false,
            size: None,
            last_modified: None,
        });
    }
    
    let is_file = path_ref.is_file();
    let is_directory = path_ref.is_dir();
    
    let (size, last_modified) = if is_file {
        let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
        let size = Some(metadata.len());
        let last_modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());
        (size, last_modified)
    } else {
        (None, None)
    };
    
    Ok(FileMetadata {
        path,
        exists,
        is_file,
        is_directory,
        size,
        last_modified,
    })
}

/// Create directory
#[tauri::command]
pub fn create_dir(path: String, recursive: bool) -> Result<(), String> {
    if recursive {
        fs::create_dir_all(&path).map_err(|e| e.to_string())
    } else {
        fs::create_dir(&path).map_err(|e| e.to_string())
    }
}

/// Delete file or directory
#[tauri::command]
pub fn delete_path(path: String) -> Result<(), String> {
    let path_ref = Path::new(&path);
    
    if path_ref.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&path).map_err(|e| e.to_string())
    }
}

/// Rename/move file or directory
#[tauri::command]
pub fn rename_path(from: String, to: String) -> Result<(), String> {
    fs::rename(&from, &to).map_err(|e| e.to_string())
}

/// Copy file
#[tauri::command]
pub fn copy_file(from: String, to: String) -> Result<(), String> {
    fs::copy(&from, &to).map(|_| ()).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_get_file_name() {
        assert_eq!(get_file_name("/path/to/file.md"), "file.md");
        assert_eq!(get_file_name("file.md"), "file.md");
        assert_eq!(get_file_name("/path/to/dir/"), "dir");
        assert_eq!(get_file_name(""), "");
    }

    #[test]
    fn test_read_file_success() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        
        fs::write(&file_path, "# Hello World").unwrap();
        
        let result = read_file(file_path.to_string_lossy().to_string());
        
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert_eq!(result.content, "# Hello World");
        assert_eq!(result.name, "test.md");
        assert!(result.error.is_none());
    }

    #[test]
    fn test_read_file_not_found() {
        let result = read_file("/nonexistent/file.md".to_string());
        
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(!result.success);
        assert!(result.error.is_some());
        assert_eq!(result.content, "");
    }

    #[test]
    fn test_write_file_success() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        
        let result = write_file(file_path.to_string_lossy().to_string(), "# Test".to_string());
        
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert!(result.error.is_none());
        
        let content = fs::read_to_string(&file_path).unwrap();
        assert_eq!(content, "# Test");
    }

    #[test]
    fn test_file_exists() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        
        fs::write(&file_path, "content").unwrap();
        
        let result = file_exists(file_path.to_string_lossy().to_string());
        assert!(result.is_ok());
        assert!(result.unwrap());
        
        let result = file_exists("/nonexistent/file.md".to_string());
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    #[test]
    fn test_check_access_readable_and_writable() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        
        fs::write(&file_path, "content").unwrap();
        
        let result = check_access(file_path.to_string_lossy().to_string());
        
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.readable);
        assert!(result.writable);
    }

    #[test]
    fn test_list_dir_success() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        let subdir_path = dir.path().join("subdir");
        
        fs::write(&file_path, "content").unwrap();
        fs::create_dir(&subdir_path).unwrap();
        
        let result = list_dir(dir.path().to_string_lossy().to_string());
        
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert_eq!(result.entries.len(), 2);
    }

    #[test]
    fn test_get_file_metadata_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        
        fs::write(&file_path, "content").unwrap();
        
        let result = get_file_metadata(file_path.to_string_lossy().to_string());
        
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.exists);
        assert!(result.is_file);
        assert!(!result.is_directory);
        assert!(result.size.is_some());
    }

    #[test]
    fn test_create_dir() {
        let parent_dir = tempdir().unwrap();
        let new_dir_path = parent_dir.path().join("new_dir");
        
        let result = create_dir(new_dir_path.to_string_lossy().to_string(), false);
        
        assert!(result.is_ok());
        assert!(new_dir_path.exists());
    }

    #[test]
    fn test_delete_path_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        
        fs::write(&file_path, "content").unwrap();
        
        let result = delete_path(file_path.to_string_lossy().to_string());
        
        assert!(result.is_ok());
        assert!(!file_path.exists());
    }

    #[test]
    fn test_rename_path() {
        let dir = tempdir().unwrap();
        let old_path = dir.path().join("old.md");
        let new_path = dir.path().join("new.md");
        
        fs::write(&old_path, "content").unwrap();
        
        let result = rename_path(
            old_path.to_string_lossy().to_string(),
            new_path.to_string_lossy().to_string(),
        );
        
        assert!(result.is_ok());
        assert!(!old_path.exists());
        assert!(new_path.exists());
    }

    #[test]
    fn test_copy_file() {
        let dir = tempdir().unwrap();
        let src_path = dir.path().join("src.md");
        let dst_path = dir.path().join("dst.md");
        
        fs::write(&src_path, "content").unwrap();
        
        let result = copy_file(
            src_path.to_string_lossy().to_string(),
            dst_path.to_string_lossy().to_string(),
        );
        
        assert!(result.is_ok());
        assert!(src_path.exists());
        assert!(dst_path.exists());
    }
}
