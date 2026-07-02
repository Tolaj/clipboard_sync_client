import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getClipHistory } from "../lib/api";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

interface Clip {
  _id: string;
  content: string;
  contentType: string;
  sourceDevice: { name: string; platform: string } | null;
  createdAt: string;
}

function ClipboardHistory() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    const addClip = (event: { payload: Clip }) => {
      setClips((prev) => [event.payload, ...prev].slice(0, 100));
    };
    const unlistenReceived = listen<Clip>("clip-received", addClip);
    const unlistenSent = listen<Clip>("clip-sent", addClip);
    return () => {
      unlistenReceived.then((fn) => fn());
      unlistenSent.then((fn) => fn());
    };
  }, []);

  async function loadHistory() {
    try {
      const res = await getClipHistory(50);
      setClips(res.clips);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(clip: Clip) {
    try {
      if (clip.contentType === "image") {
        const { writeImage } = await import("@tauri-apps/plugin-clipboard-manager");
        const binary = atob(clip.content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        await writeImage(bytes);
      } else {
        await writeText(clip.content);
      }
      setCopiedId(clip._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  if (loading) return <div className="loading">Loading history...</div>;

  if (clips.length === 0) {
    return <div className="empty-state">No clipboard history yet. Copy something to get started!</div>;
  }

  return (
    <div className="clip-history">
      {clips.map((clip) => (
        <div
          key={clip._id}
          className="clip-item"
          onClick={() => copyToClipboard(clip)}
        >
          {clip.contentType === "image" ? (
            <div className="clip-image">
              <img src={`data:image/png;base64,${clip.content}`} alt="Clipboard image" />
            </div>
          ) : (
            <div className="clip-content">
              {clip.content.length > 200 ? clip.content.slice(0, 200) + "..." : clip.content}
            </div>
          )}
          <div className="clip-meta">
            <span>{clip.contentType === "image" ? "Image" : ""} {clip.sourceDevice?.name || "Unknown device"}</span>
            <span>{formatTime(clip.createdAt)}</span>
            {copiedId === clip._id && <span className="copied-badge">Copied!</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export default ClipboardHistory;
