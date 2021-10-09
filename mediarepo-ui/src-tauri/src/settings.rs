use serde::{Serialize, Deserialize};
use crate::commands::repo::Repository;
use crate::error::AppResult;
use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;

static SETTINGS_FILE: &str = "settings.toml";

#[derive(Default, Serialize, Deserialize)]
pub struct Settings {
  pub repositories: Vec<Repository>,
}

fn get_settings_path() -> PathBuf {
  let dirs = ProjectDirs::from("com", "trivernis", "mediarepo").unwrap();
  let config_path = dirs.config_dir().to_path_buf();

  config_path.join(SETTINGS_FILE)
}

/// Writes the settings to the file
pub fn save_settings(settings: &Settings) -> AppResult<()> {
  let settings_path = get_settings_path();
  let settings_string = toml::to_string(&settings)?;
  fs::write(&settings_path, &settings_string.into_bytes())?;

  Ok(())
}

/// Loads the settings from the file
pub fn load_settings() -> AppResult<Settings> {
  let dirs = ProjectDirs::from("com", "trivernis", "mediarepo").unwrap();
  let config_path = dirs.config_dir().to_path_buf();
  if !config_path.exists() {
    fs::create_dir_all(&config_path)?;
  }
  let settings_path = config_path.join(SETTINGS_FILE);
  if !settings_path.exists() {
    let settings = Settings::default();
    save_settings(&settings)?;
  }
  let config_str = fs::read_to_string(settings_path)?;
  let settings = toml::from_str(&config_str)?;

  Ok(settings)
}
