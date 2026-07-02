import { fetch } from "@tauri-apps/plugin-http";
import { load } from "@tauri-apps/plugin-store";

let cachedServerUrl: string | null = null;
let cachedToken: string | null = null;

async function getConfig() {
  if (cachedServerUrl && cachedToken) return { serverUrl: cachedServerUrl, token: cachedToken };
  const store = await load("settings.json", { defaults: {}, autoSave: true });
  cachedServerUrl = await store.get<string>("serverUrl") || "http://localhost:3000";
  cachedToken = await store.get<string>("deviceToken") || "";
  return { serverUrl: cachedServerUrl, token: cachedToken };
}

export function clearConfigCache() {
  cachedServerUrl = null;
  cachedToken = null;
}

async function request(method: string, path: string, body?: unknown) {
  const { serverUrl, token } = await getConfig();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${serverUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function registerDevice(serverUrl: string, deviceName: string, platform: string) {
  const res = await fetch(`${serverUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceName, platform }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function pairDevice(serverUrl: string, pairingCode: string, deviceName: string, platform: string) {
  const res = await fetch(`${serverUrl}/api/auth/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairingCode, deviceName, platform }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Pairing failed");
  }
  return res.json();
}

export async function getLatestClip(after?: string) {
  const params = after ? `?after=${encodeURIComponent(after)}` : "";
  return request("GET", `/api/clip/latest${params}`);
}

export async function pushClip(content: string, contentType = "text") {
  return request("POST", "/api/clip", { content, contentType });
}

export async function getClipHistory(limit = 20) {
  return request("GET", `/api/clip/history?limit=${limit}`);
}

export async function getDevices() {
  return request("GET", "/api/devices");
}

export async function removeDevice(deviceId: string) {
  return request("DELETE", `/api/devices/${deviceId}`);
}
