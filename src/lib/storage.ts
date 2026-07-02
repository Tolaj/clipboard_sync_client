import { load, type Store } from "@tauri-apps/plugin-store";

let store: Store | null = null;

async function getStore() {
  if (!store) store = await load("settings.json", { defaults: {}, autoSave: true });
  return store;
}

export async function saveCredentials(serverUrl: string, deviceToken: string, groupId: string, deviceId: string, encryptionKey?: string) {
  const s = await getStore();
  await s.set("serverUrl", serverUrl);
  await s.set("deviceToken", deviceToken);
  await s.set("groupId", groupId);
  await s.set("deviceId", deviceId);
  if (encryptionKey) {
    await s.set("encryptionKey", encryptionKey);
  }
}

export async function getCredentials() {
  const s = await getStore();
  return {
    serverUrl: await s.get<string>("serverUrl"),
    deviceToken: await s.get<string>("deviceToken"),
    groupId: await s.get<string>("groupId"),
    deviceId: await s.get<string>("deviceId"),
  };
}

export async function clearCredentials() {
  const s = await getStore();
  await s.delete("deviceToken");
  await s.delete("groupId");
  await s.delete("deviceId");
  await s.delete("encryptionKey");
}
