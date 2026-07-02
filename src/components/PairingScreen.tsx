import { useState } from "react";
import { registerDevice, pairDevice } from "../lib/api";
import { saveCredentials } from "../lib/storage";
import { clearConfigCache } from "../lib/api";

interface Props {
  onPaired: (pairingCode: string | null) => void;
}

function PairingScreen({ onPaired }: Props) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [deviceName, setDeviceName] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!deviceName.trim()) return setError("Device name is required");
    setLoading(true);
    setError(null);
    try {
      const res = await registerDevice(serverUrl, deviceName.trim(), getPlatform());
      await saveCredentials(serverUrl, res.deviceToken, res.groupId, res.deviceId);
      clearConfigCache();
      setGeneratedCode(res.pairingCode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!deviceName.trim()) return setError("Device name is required");
    if (!pairingCode.trim()) return setError("Pairing code is required");
    setLoading(true);
    setError(null);
    try {
      const res = await pairDevice(serverUrl, pairingCode.trim().toUpperCase(), deviceName.trim(), getPlatform());
      await saveCredentials(serverUrl, res.deviceToken, res.groupId, res.deviceId);
      clearConfigCache();
      onPaired(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pairing failed");
    } finally {
      setLoading(false);
    }
  }

  if (generatedCode) {
    return (
      <div className="pairing-screen">
        <h1>Group Created!</h1>
        <p>Enter this code on your other devices:</p>
        <div className="pairing-code">{generatedCode}</div>
        <button onClick={() => onPaired(generatedCode)}>Continue</button>
      </div>
    );
  }

  return (
    <div className="pairing-screen">
      <h1>Clipboard Sync</h1>
      <p>Sync your clipboard across all your devices</p>

      <div className="form-group">
        <label>Server URL</label>
        <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://your-server.vercel.app" />
      </div>

      <div className="form-group">
        <label>Device Name</label>
        <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="My MacBook" />
      </div>

      {mode === "choose" && (
        <div className="button-group">
          <button onClick={() => setMode("create")}>Create New Group</button>
          <button onClick={() => setMode("join")} className="secondary">Join Existing Group</button>
        </div>
      )}

      {mode === "create" && (
        <button onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </button>
      )}

      {mode === "join" && (
        <>
          <div className="form-group">
            <label>Pairing Code</label>
            <input
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="code-input"
            />
          </div>
          <button onClick={handleJoin} disabled={loading}>
            {loading ? "Joining..." : "Join Group"}
          </button>
        </>
      )}

      {mode !== "choose" && (
        <button onClick={() => { setMode("choose"); setError(null); }} className="link">Back</button>
      )}

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
