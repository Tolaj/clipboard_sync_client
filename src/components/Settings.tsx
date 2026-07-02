import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import { clearCredentials } from "../lib/storage";
import { clearConfigCache } from "../lib/api";

interface Props {
  onUnpaired: () => void;
}

function Settings({ onUnpaired }: Props) {
  const [serverUrl, setServerUrl] = useState("");
  const [groupId, setGroupId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const store = await load("settings.json", { defaults: {}, autoSave: true });
    setServerUrl((await store.get<string>("serverUrl")) || "");
    setGroupId((await store.get<string>("groupId")) || "");
  }

  async function saveServerUrl() {
    const store = await load("settings.json", { defaults: {}, autoSave: true });
    await store.set("serverUrl", serverUrl);
    clearConfigCache();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleUnpair() {
    await clearCredentials();
    clearConfigCache();
    onUnpaired();
  }

  return (
    <div className="settings">
      <div className="setting-group">
        <label>Server URL</label>
        <div className="input-row">
          <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <button onClick={saveServerUrl}>{saved ? "Saved!" : "Save"}</button>
        </div>
      </div>

      <div className="setting-group">
        <label>Group ID</label>
        <div className="setting-value">{groupId || "Not connected"}</div>
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
