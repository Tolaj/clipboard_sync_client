import { useState, useEffect } from "react";
import { getDevices, removeDevice } from "../lib/api";

interface Device {
  _id: string;
  name: string;
  platform: string;
  lastSeen: string;
  isCurrent: boolean;
}

function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      const res = await getDevices();
      setDevices(res.devices);
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(deviceId: string) {
    try {
      await removeDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d._id !== deviceId));
    } catch (err) {
      console.error("Failed to remove device:", err);
    }
  }

  if (loading) return <div className="loading">Loading devices...</div>;

  return (
    <div className="device-list">
      {devices.map((device) => (
        <div key={device._id} className="device-item">
          <div className="device-icon">{platformIcon(device.platform)}</div>
          <div className="device-info">
            <div className="device-name">
              {device.name}
              {device.isCurrent && <span className="current-badge">This device</span>}
            </div>
            <div className="device-meta">
              {device.platform} &middot; Last seen {formatTime(device.lastSeen)}
            </div>
          </div>
          {!device.isCurrent && (
            <button className="remove-btn" onClick={() => handleRemove(device._id)}>Remove</button>
          )}
        </div>
      ))}
    </div>
  );
}

function platformIcon(platform: string): string {
  const icons: Record<string, string> = {
    macos: "💻",
    windows: "🖥️",
    linux: "🐧",
    android: "📱",
    ios: "📱",
  };
  return icons[platform] || "💻";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export default DeviceList;
