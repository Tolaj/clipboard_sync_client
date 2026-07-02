use sha2::{Digest, Sha256};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tokio::time::{sleep, Duration};

use crate::state::AppState;
use crate::sync::SyncClient;

fn hash_content(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn start_sync(app: &AppHandle) {
    let state = app.state::<AppState>();

    {
        let mut running = state.sync_running.lock().unwrap();
        if *running {
            return;
        }
        *running = true;
    }

    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.device_token.lock().unwrap().clone();

    let Some(token) = token else {
        return;
    };

    let app_handle = app.clone();
    let sync_client = Arc::new(SyncClient::new(&server_url, &token));

    // Outbound: monitor local clipboard changes
    let outbound_app = app_handle.clone();
    let outbound_client = sync_client.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_millis(150)).await;
            if let Err(e) = outbound_tick(&outbound_app, &outbound_client).await {
                eprintln!("Outbound sync error: {}", e);
            }
        }
    });

    // Inbound: poll server for new clips
    let inbound_app = app_handle.clone();
    let inbound_client = sync_client.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_millis(500)).await;
            if let Err(e) = inbound_tick(&inbound_app, &inbound_client).await {
                eprintln!("Inbound sync error: {}", e);
            }
        }
    });
}

async fn outbound_tick(app: &AppHandle, client: &SyncClient) -> Result<(), String> {
    let state = app.state::<AppState>();

    let is_self_write = *state.self_write_in_progress.lock().unwrap();
    if is_self_write {
        return Ok(());
    }

    let content = match app.clipboard().read_text() {
        Ok(text) => text,
        Err(_) => return Ok(()),
    };

    if content.is_empty() {
        return Ok(());
    }

    let hash = hash_content(&content);
    let last_hash = state.last_clip_hash.lock().unwrap().clone();

    if hash == last_hash {
        return Ok(());
    }

    match client.push_clip(&content).await {
        Ok(res) => {
            *state.last_clip_hash.lock().unwrap() = hash;
            if let Some(created_at) = &res.created_at {
                *state.last_sync_time.lock().unwrap() = created_at.clone();
            }
            if res.status == "created" {
                let clip = crate::sync::ClipData {
                    _id: res.clip_id.unwrap_or(serde_json::Value::Null),
                    content,
                    content_type: "text".to_string(),
                    source_device: Some(crate::sync::SourceDevice {
                        name: "This device".to_string(),
                        platform: std::env::consts::OS.to_string(),
                    }),
                    created_at: res.created_at.unwrap_or_default(),
                };
                let _ = app.emit("clip-sent", &clip);
            }
            println!("Outbound: pushed clip ({})", res.status);
        }
        Err(e) => {
            eprintln!("Outbound push failed: {}", e);
        }
    }

    Ok(())
}

async fn inbound_tick(app: &AppHandle, client: &SyncClient) -> Result<(), String> {
    let state = app.state::<AppState>();

    let after = {
        let t = state.last_sync_time.lock().unwrap().clone();
        if t.is_empty() { None } else { Some(t) }
    };

    let res = client.get_latest(after.as_deref()).await?;

    let Some(clip) = res.clip else {
        return Ok(());
    };

    let clip_hash = hash_content(&clip.content);
    let last_hash = state.last_clip_hash.lock().unwrap().clone();
    if clip_hash == last_hash {
        return Ok(());
    }

    {
        *state.self_write_in_progress.lock().unwrap() = true;
    }

    app.clipboard()
        .write_text(&clip.content)
        .map_err(|e| e.to_string())?;

    {
        *state.last_clip_hash.lock().unwrap() = clip_hash;
        *state.last_sync_time.lock().unwrap() = clip.created_at.clone();
        *state.self_write_in_progress.lock().unwrap() = false;
    }

    let _ = app.emit("clip-received", &clip);
    println!(
        "Inbound: received clip from {}",
        clip.source_device
            .as_ref()
            .map(|d| d.name.as_str())
            .unwrap_or("unknown")
    );

    Ok(())
}
