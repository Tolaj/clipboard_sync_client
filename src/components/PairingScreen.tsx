import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { registerDevice, pairDevice } from "../lib/api";
import { saveCredentials } from "../lib/storage";
import { clearConfigCache } from "../lib/api";
import AppLogo from "./AppLogo";

interface Props {
  onPaired: (pairingCode: string | null) => void;
}

const PRESET_SERVERS = [
  { label: "Server 1", url: "https://clipboard-sync-server.vercel.app" },
];

function PairingScreen({ onPaired }: Props) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [serverUrl, setServerUrl] = useState(PRESET_SERVERS[0].url);
  const [useCustomServer, setUseCustomServer] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectPreset(url: string) {
    setUseCustomServer(false);
    setServerUrl(url);
  }

  function selectCustom() {
    setUseCustomServer(true);
    if (PRESET_SERVERS.some((s) => s.url === serverUrl)) {
      setServerUrl("");
    }
  }

  function getEffectiveUrl() {
    let url = serverUrl.trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return url;
  }

  async function handleCreate() {
    if (!deviceName.trim()) return setError("Device name is required");
    const url = getEffectiveUrl();
    if (!url) return setError("Server URL is required");
    setLoading(true);
    setError(null);
    try {
      const encKey: string = await invoke("generate_encryption_key");
      const res = await registerDevice(url, deviceName.trim(), getPlatform());
      await saveCredentials(url, res.deviceToken, res.groupId, res.deviceId, encKey);
      clearConfigCache();
      setGeneratedCode(`${res.pairingCode}-${encKey}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!deviceName.trim()) return setError("Device name is required");
    if (!pairingCode.trim()) return setError("Pairing code is required");

    const parts = pairingCode.trim().split("-");
    if (parts.length < 2) return setError("Invalid code. Use the full code from the group creator.");
    const serverPairingCode = parts[0].toUpperCase();
    const encKey = parts.slice(1).join("-");

    const url = getEffectiveUrl();
    if (!url) return setError("Server URL is required");
    setLoading(true);
    setError(null);
    try {
      const res = await pairDevice(url, serverPairingCode, deviceName.trim(), getPlatform());
      await saveCredentials(url, res.deviceToken, res.groupId, res.deviceId, encKey);
      clearConfigCache();
      onPaired(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pairing failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (generatedCode) {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(generatedCode);
    }
  }

  if (generatedCode) {
    return (
      <div className="pairing-screen">
        <AppLogo size={64} />
        <h1>Group Created!</h1>
        <p>Share this code with your other devices:</p>
        <div className="pairing-code" style={{ fontSize: "1rem", letterSpacing: "0.1rem", cursor: "pointer" }} onClick={copyCode} title="Click to copy">
          {generatedCode}
        </div>
        <p className="help-text">This code contains your encryption key. Keep it private.</p>
        <button onClick={() => onPaired(generatedCode)}>Continue</button>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="pairing-screen">
        <AppLogo size={72} />
        <h1>Clipboard Sync</h1>
        <p>Sync your clipboard across all your devices</p>
        <div className="button-group">
          <button onClick={() => setMode("create")}>Create New Group</button>
          <button onClick={() => setMode("join")} className="secondary">Join Existing Group</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pairing-screen">
      <AppLogo size={72} />
      <h1>{mode === "create" ? "Create Group" : "Join Group"}</h1>

      <div className="form-group">
        <label>Server</label>
        <div className="server-options">
          {PRESET_SERVERS.map((s) => (
            <button
              key={s.url}
              className={`server-preset-btn ${!useCustomServer && serverUrl === s.url ? "active" : ""}`}
              onClick={() => selectPreset(s.url)}
            >
              {s.label}
              {!useCustomServer && serverUrl === s.url && " ✓"}
            </button>
          ))}
          <button
            className={`server-preset-btn ${useCustomServer ? "active" : ""}`}
            onClick={selectCustom}
          >
            Custom
          </button>
        </div>
        {useCustomServer && (
          <input
            style={{ marginTop: 8 }}
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://your-server.example.com"
          />
        )}
      </div>

      <div className="form-group">
        <label>Device Name</label>
        <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="My MacBook" />
      </div>

      {mode === "join" && (
        <div className="form-group">
          <label>Pairing Code</label>
          <input
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value)}
            placeholder="ABC123-xxxxxxxxxxxxxxx"
          />
          <p className="help-text" style={{ marginTop: 4 }}>Paste the full code from the group creator</p>
        </div>
      )}

      <button onClick={mode === "create" ? handleCreate : handleJoin} disabled={loading}>
        {loading ? (mode === "create" ? "Creating..." : "Joining...") : (mode === "create" ? "Create Group" : "Join Group")}
      </button>

      <button onClick={() => { setMode("choose"); setError(null); }} className="link">Back</button>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

function getPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
  return "unknown";
}

export default PairingScreen;
