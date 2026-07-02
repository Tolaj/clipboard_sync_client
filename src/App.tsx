import { useState, useEffect } from "react";
import PairingScreen from "./components/PairingScreen";
import ClipboardHistory from "./components/ClipboardHistory";
import DeviceList from "./components/DeviceList";
import Settings from "./components/Settings";
import AppLogo from "./components/AppLogo";
import LandingPage from "./components/LandingPage";

const isTauri = !!(window as any).__TAURI_INTERNALS__;

type Tab = "history" | "devices" | "settings";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri) return;
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { load } = await import("@tauri-apps/plugin-store");
      const store = await load("settings.json", { defaults: {}, autoSave: true });
      const token = await store.get<string>("deviceToken");
      const serverUrl = await store.get<string>("serverUrl");
      if (token && serverUrl) {
        await startSync(serverUrl, token);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    }
  }

  async function startSync(serverUrl: string, token: string) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("start_clipboard_sync", {
        serverUrl,
        deviceToken: token,
      });
      console.log("Clipboard sync started");
    } catch (err) {
      console.error("Failed to start sync:", err);
    }
  }

  async function handlePaired(code: string | null) {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("settings.json", { defaults: {}, autoSave: true });
    const token = await store.get<string>("deviceToken");
    const serverUrl = await store.get<string>("serverUrl");
    if (token && serverUrl) {
      await startSync(serverUrl, token);
    }
    setPairingCode(code);
    setAuthenticated(true);
  }

  if (!isTauri) {
    return <LandingPage />;
  }

  if (authenticated === null) {
    return <div className="loading">Loading...</div>;
  }

  if (!authenticated) {
    return <PairingScreen onPaired={handlePaired} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <AppLogo size={28} />
          <h1>Clipboard Sync</h1>
        </div>
        {pairingCode && (
          <div className="pairing-badge">
            Code: <strong>{pairingCode}</strong>
          </div>
        )}
      </header>
      <nav className="tab-bar">
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          className={activeTab === "devices" ? "active" : ""}
          onClick={() => setActiveTab("devices")}
        >
          Devices
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </nav>
      <main className="tab-content">
        {activeTab === "history" && <ClipboardHistory />}
        {activeTab === "devices" && <DeviceList />}
        {activeTab === "settings" && (
          <Settings
            onUnpaired={() => {
              setPairingCode(null);
              setAuthenticated(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
