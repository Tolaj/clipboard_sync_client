use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

use crate::state::AppState;

#[derive(Debug, Deserialize)]
struct RegisterResponse {
    #[serde(rename = "groupId")]
    group_id: serde_json::Value,
    #[serde(rename = "pairingCode")]
    pairing_code: String,
    #[serde(rename = "deviceToken")]
    device_token: String,
    #[serde(rename = "deviceId")]
    device_id: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct PairResponse {
    #[serde(rename = "groupId")]
    group_id: serde_json::Value,
    #[serde(rename = "deviceToken")]
    device_token: String,
    #[serde(rename = "deviceId")]
    device_id: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct RegisterResult {
    pub group_id: String,
    pub pairing_code: String,
    pub device_token: String,
    pub device_id: String,
}

#[derive(Debug, Serialize)]
pub struct PairResult {
    pub group_id: String,
    pub device_token: String,
    pub device_id: String,
}

#[derive(Debug, Serialize)]
pub struct SyncStatus {
    pub connected: bool,
    pub server_url: String,
    pub last_sync: String,
}

#[tauri::command]
pub async fn register_device(
    server_url: String,
    device_name: String,
    platform: String,
    state: State<'_, AppState>,
) -> Result<RegisterResult, String> {
    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/api/auth/register", server_url))
        .json(&serde_json::json!({
            "deviceName": device_name,
            "platform": platform,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err("Registration failed".to_string());
    }

    let data: RegisterResponse = res.json().await.map_err(|e| e.to_string())?;

    *state.server_url.lock().unwrap() = server_url;
    *state.device_token.lock().unwrap() = Some(data.device_token.clone());
    *state.group_id.lock().unwrap() = Some(data.group_id.to_string());

    Ok(RegisterResult {
        group_id: data.group_id.to_string(),
        pairing_code: data.pairing_code,
        device_token: data.device_token,
        device_id: data.device_id.to_string(),
    })
}

#[tauri::command]
pub async fn pair_device(
    server_url: String,
    pairing_code: String,
    device_name: String,
    platform: String,
    state: State<'_, AppState>,
) -> Result<PairResult, String> {
    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/api/auth/pair", server_url))
        .json(&serde_json::json!({
            "pairingCode": pairing_code,
            "deviceName": device_name,
            "platform": platform,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Pairing failed: {}", err_text));
    }

    let data: PairResponse = res.json().await.map_err(|e| e.to_string())?;

    *state.server_url.lock().unwrap() = server_url;
    *state.device_token.lock().unwrap() = Some(data.device_token.clone());
    *state.group_id.lock().unwrap() = Some(data.group_id.to_string());

    Ok(PairResult {
        group_id: data.group_id.to_string(),
        device_token: data.device_token,
        device_id: data.device_id.to_string(),
    })
}

#[tauri::command]
pub async fn get_sync_status(state: State<'_, AppState>) -> Result<SyncStatus, String> {
    Ok(SyncStatus {
        connected: state.device_token.lock().unwrap().is_some(),
        server_url: state.server_url.lock().unwrap().clone(),
        last_sync: state.last_sync_time.lock().unwrap().clone(),
    })
}

#[tauri::command]
pub async fn start_clipboard_sync(
    server_url: String,
    device_token: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let state = app.state::<AppState>();
    *state.server_url.lock().unwrap() = server_url;
    *state.device_token.lock().unwrap() = Some(device_token);
    crate::clipboard::start_sync(&app);
    Ok(())
}

#[tauri::command]
pub fn generate_encryption_key() -> String {
    crate::crypto::generate_key()
}
