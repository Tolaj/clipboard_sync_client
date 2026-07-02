import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import { clearCredentials } from "../lib/storage";
import { clearConfigCache } from "../lib/api";

interface Props {
  onUnpaired: () => void;
}

const PRESET_SERVERS = [
  { label: "Server 1", url: "https://clipboard-sync-server.vercel.app" },
];

function Settings({ onUnpaired }: Props) {
  const [serverUrl, setServerUrl] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [saved, setSaved] = useState(false);
  const [syncImages, setSyncImages] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const store = await load("settings.json", { defaults: {}, autoSave: true });
    const url = (await store.get<string>("serverUrl")) || "";
    setServerUrl(url);
    setUseCustom(url !== "" && !PRESET_SERVERS.some((s) => s.url === url));
    setGroupId((await store.get<string>("groupId")) || "");
    const imgSync = await store.get<boolean>("syncImages");
    setSyncImages(imgSync !== false);
  }

  async function applyUrl(url: string) {
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setServerUrl(url);
    const store = await load("settings.json", { defaults: {}, autoSave: true });
    await store.set("serverUrl", url);
    clearConfigCache();
    const token = await store.get<string>("deviceToken");
    if (token && url) {
      await invoke("start_clipboard_sync", { serverUrl: url, deviceToken: token });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleSyncImages(enabled: boolean) {
    setSyncImages(enabled);
    const store = await load("settings.json", { defaults: {}, autoSave: true });
    await store.set("syncImages", enabled);
  }

  async function handleUnpair() {
    await clearCredentials();
    clearConfigCache();
    onUnpaired();
  }

  const isPresetActive = (url: string) => serverUrl === url;

  return (
    <div className="settings">
      <div className="setting-group">
        <label>Server</label>
        <div className="server-options">
          {PRESET_SERVERS.map((s) => (
            <button
              key={s.url}
              className={`server-preset-btn ${isPresetActive(s.url) ? "active" : ""}`}
              onClick={() => { setUseCustom(false); applyUrl(s.url); }}
            >
              {s.label}
              {isPresetActive(s.url) && " ✓"}
            </button>
          ))}
          <button
            className={`server-preset-btn ${useCustom ? "active" : ""}`}
            onClick={() => setUseCustom(true)}
          >
            Custom
          </button>
        </div>
        {useCustom && (
          <div className="input-row" style={{ marginTop: 8 }}>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-server.example.com"
            />
            <button onClick={() => applyUrl(serverUrl.trim())} disabled={!serverUrl.trim()}>{saved ? "Saved!" : "Save"}</button>
          </div>
        )}
      </div>

      <div className="setting-group">
        <label>Group ID</label>
        <div className="setting-value">{groupId || "Not connected"}</div>
      </div>

      <div className="setting-group">
        <label>Sync Config</label>
        <div className="config-options">
          <label className="config-checkbox disabled">
            <input type="checkbox" checked disabled />
            <span>Text</span>
          </label>
          <label className="config-checkbox">
            <input
              type="checkbox"
              checked={syncImages}
              onChange={(e) => toggleSyncImages(e.target.checked)}
            />
            <span>Images</span>
          </label>
        </div>
      </div>

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <button className="danger-btn" onClick={handleUnpair}>
          Disconnect & Unpair
        </button>
        <p className="help-text">This will remove this device from the sync group.</p>
      </div>
    </div>
  );
}

export default Settings;
