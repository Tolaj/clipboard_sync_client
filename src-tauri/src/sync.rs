use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct PushClipBody {
    content: String,
    #[serde(rename = "contentType")]
    content_type: String,
}

#[derive(Debug, Deserialize)]
pub struct PushClipResponse {
    pub status: String,
    #[serde(rename = "clipId")]
    pub clip_id: Option<serde_json::Value>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct SourceDevice {
    pub name: String,
    pub platform: String,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct ClipData {
    pub _id: serde_json::Value,
    pub content: String,
    #[serde(rename = "contentType")]
    pub content_type: String,
    #[serde(rename = "sourceDevice")]
    pub source_device: Option<SourceDevice>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct LatestResponse {
    pub clip: Option<ClipData>,
}

pub struct SyncClient {
    client: Client,
    server_url: String,
    token: String,
}

impl SyncClient {
    pub fn new(server_url: &str, token: &str) -> Self {
        Self {
            client: Client::new(),
            server_url: server_url.to_string(),
            token: token.to_string(),
        }
    }

    pub async fn push_clip(&self, content: &str, content_type: &str) -> Result<PushClipResponse, String> {
        let res = self
            .client
            .post(format!("{}/api/clip", self.server_url))
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&PushClipBody {
                content: content.to_string(),
                content_type: content_type.to_string(),
            })
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Push failed: {}", res.status()));
        }

        res.json().await.map_err(|e| e.to_string())
    }

    pub async fn get_latest(&self, after: Option<&str>) -> Result<LatestResponse, String> {
        let mut url = format!("{}/api/clip/latest", self.server_url);
        if let Some(after) = after {
            url = format!("{}?after={}", url, after);
        }

        let res = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.token))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Fetch failed: {}", res.status()));
        }

        res.json().await.map_err(|e| e.to_string())
    }
}
