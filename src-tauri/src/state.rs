use std::sync::Mutex;
use tokio_util::sync::CancellationToken;

pub struct AppState {
    pub device_token: Mutex<Option<String>>,
    pub group_id: Mutex<Option<String>>,
    pub server_url: Mutex<String>,
    pub last_clip_hash: Mutex<String>,
    pub last_sync_time: Mutex<String>,
    pub self_write_in_progress: Mutex<bool>,
    pub sync_running: Mutex<bool>,
    pub cancel_token: Mutex<CancellationToken>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            device_token: Mutex::new(None),
            group_id: Mutex::new(None),
            server_url: Mutex::new(String::from("http://localhost:3000")),
            last_clip_hash: Mutex::new(String::new()),
            last_sync_time: Mutex::new(String::new()),
            self_write_in_progress: Mutex::new(false),
            sync_running: Mutex::new(false),
            cancel_token: Mutex::new(CancellationToken::new()),
        }
    }
}
