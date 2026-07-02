use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use image::ImageEncoder;
use sha2::{Digest, Sha256};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tauri::image::Image as TauriImage;
use tauri_plugin_clipboard_manager::ClipboardExt;
use tokio::time::{sleep, Duration};
use tokio_util::sync::CancellationToken;

use crate::state::AppState;
use crate::sync::SyncClient;
use tauri_plugin_store::StoreExt;

fn hash_content(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    hex::encode(hasher.finalize())
}

fn rgba_to_png(rgba: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut buf);
    encoder
        .write_image(rgba, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| e.to_string())?;
    Ok(buf)
}

fn png_to_rgba(png_data: &[u8]) -> Result<(Vec<u8>, u32, u32), String> {
    let img = image::load_from_memory_with_format(png_data, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    let rgba = img.to_rgba8();
    let width = rgba.width();
    let height = rgba.height();
    Ok((rgba.into_raw(), width, height))
}

pub fn start_sync(app: &AppHandle) {
    let state = app.state::<AppState>();

    {
        let mut running = state.sync_running.lock().unwrap();
        if *running {
            let old_token = state.cancel_token.lock().unwrap();
            old_token.cancel();
            *running = false;
        }
    }

    let cancel_token = CancellationToken::new();
    *state.cancel_token.lock().unwrap() = cancel_token.clone();
    *state.sync_running.lock().unwrap() = true;

    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.device_token.lock().unwrap().clone();

    let Some(token) = token else {
        return;
    };

    let app_handle = app.clone();
    let sync_client = Arc::new(SyncClient::new(&server_url, &token));

    let outbound_app = app_handle.clone();
    let outbound_client = sync_client.clone();
    let outbound_cancel = cancel_token.clone();
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = outbound_cancel.cancelled() => break,
                _ = sleep(Duration::from_millis(150)) => {}
            }
            if let Err(e) = outbound_tick(&outbound_app, &outbound_client).await {
                eprintln!("Outbound sync error: {}", e);
            }
        }
    });

    let inbound_app = app_handle.clone();
    let inbound_client = sync_client.clone();
    let inbound_cancel = cancel_token.clone();
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = inbound_cancel.cancelled() => break,
                _ = sleep(Duration::from_millis(500)) => {}
            }
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

    // Try text first
    if let Ok(text) = app.clipboard().read_text() {
        if !text.is_empty() {
            let hash = hash_content(&text);
            let last_hash = state.last_clip_hash.lock().unwrap().clone();
            if hash != last_hash {
                match client.push_clip(&text, "text").await {
                    Ok(res) => {
                        *state.last_clip_hash.lock().unwrap() = hash;
                        if let Some(created_at) = &res.created_at {
                            *state.last_sync_time.lock().unwrap() = created_at.clone();
                        }
                        if res.status == "created" {
                            let clip = crate::sync::ClipData {
                                _id: res.clip_id.unwrap_or(serde_json::Value::Null),
                                content: text,
                                content_type: "text".to_string(),
                                source_device: Some(crate::sync::SourceDevice {
                                    name: "This device".to_string(),
                                    platform: std::env::consts::OS.to_string(),
                                }),
                                created_at: res.created_at.unwrap_or_default(),
                            };
                            let _ = app.emit("clip-sent", &clip);
                        }
                        println!("Outbound: pushed text clip ({})", res.status);
                    }
                    Err(e) => eprintln!("Outbound push failed: {}", e),
                }
            }
            return Ok(());
        }
    }

    // Try image (only if enabled in settings)
    let sync_images = app.store("settings.json")
        .ok()
        .and_then(|s| s.get("syncImages"))
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

    if !sync_images {
        return Ok(());
    }

    if let Ok(img) = app.clipboard().read_image() {
        let rgba = img.rgba().to_vec();
        let width = img.width();
        let height = img.height();
        if rgba.is_empty() {
            return Ok(());
        }

        let hash = hash_content(&format!("img:{}:{}:{}", width, height, hash_content(&String::from_utf8_lossy(&rgba))));
        let last_hash = state.last_clip_hash.lock().unwrap().clone();
        if hash == last_hash {
            return Ok(());
        }

        let png_data = rgba_to_png(&rgba, width, height)?;
        let b64 = BASE64.encode(&png_data);

        match client.push_clip(&b64, "image").await {
            Ok(res) => {
                *state.last_clip_hash.lock().unwrap() = hash;
                if let Some(created_at) = &res.created_at {
                    *state.last_sync_time.lock().unwrap() = created_at.clone();
                }
                if res.status == "created" {
                    let clip = crate::sync::ClipData {
                        _id: res.clip_id.unwrap_or(serde_json::Value::Null),
                        content: b64,
                        content_type: "image".to_string(),
                        source_device: Some(crate::sync::SourceDevice {
                            name: "This device".to_string(),
                            platform: std::env::consts::OS.to_string(),
                        }),
                        created_at: res.created_at.unwrap_or_default(),
                    };
                    let _ = app.emit("clip-sent", &clip);
                }
                println!("Outbound: pushed image clip ({})", res.status);
            }
            Err(e) => eprintln!("Outbound image push failed: {}", e),
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

    if clip.content_type == "image" {
        let png_data = BASE64.decode(&clip.content).map_err(|e| e.to_string())?;
        let (rgba, width, height) = png_to_rgba(&png_data)?;
        let img = TauriImage::new_owned(rgba, width, height);
        app.clipboard()
            .write_image(&img)
            .map_err(|e| e.to_string())?;
    } else {
        app.clipboard()
            .write_text(&clip.content)
            .map_err(|e| e.to_string())?;
    }

    {
        *state.last_clip_hash.lock().unwrap() = clip_hash;
        *state.last_sync_time.lock().unwrap() = clip.created_at.clone();
        *state.self_write_in_progress.lock().unwrap() = false;
    }

    let _ = app.emit("clip-received", &clip);
    println!(
        "Inbound: received {} clip from {}",
        clip.content_type,
        clip.source_device
            .as_ref()
            .map(|d| d.name.as_str())
            .unwrap_or("unknown")
    );

    Ok(())
}
