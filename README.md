# Clipboard Sync

Copy on one device, paste on another. End-to-end encrypted clipboard sync across macOS, Windows, and Linux.

Built with [Tauri v2](https://v2.tauri.app/), React, and Rust.

## Download

Get the latest release for your platform:

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [Clipboard.Sync_1.0.0_aarch64.dmg](https://github.com/Tolaj/clipboard_sync_client/releases/download/v1.0.0/Clipboard.Sync_1.0.0_aarch64.dmg) |
| macOS (Intel) | [Clipboard.Sync_1.0.0_x64.dmg](https://github.com/Tolaj/clipboard_sync_client/releases/download/v1.0.0/Clipboard.Sync_1.0.0_x64.dmg) |
| Windows | [Clipboard.Sync_1.0.0_x64-setup.exe](https://github.com/Tolaj/clipboard_sync_client/releases/download/v1.0.0/Clipboard.Sync_1.0.0_x64-setup.exe) |
| Linux (Debian/Ubuntu) | [Clipboard.Sync_1.0.0_amd64.deb](https://github.com/Tolaj/clipboard_sync_client/releases/download/v1.0.0/Clipboard.Sync_1.0.0_amd64.deb) |
| Linux (AppImage) | [Clipboard.Sync_1.0.0_amd64.AppImage](https://github.com/Tolaj/clipboard_sync_client/releases/download/v1.0.0/Clipboard.Sync_1.0.0_amd64.AppImage) |

[All releases](https://github.com/Tolaj/clipboard_sync_client/releases)

## Install

### macOS

1. Download the `.dmg` for your Mac (Apple Silicon or Intel)
2. Open the DMG and drag **Clipboard Sync** to **Applications**
3. The app is not code-signed yet, so macOS will block it. Run this once:
   ```bash
   xattr -cr /Applications/Clipboard\ Sync.app
   ```
4. Open Clipboard Sync from Applications

### Windows

1. Download the `.exe` installer
2. Run the installer — Windows SmartScreen may show a warning
3. Click **More info** → **Run anyway**
4. Follow the install wizard

### Linux

**Debian/Ubuntu:**
```bash
sudo dpkg -i Clipboard.Sync_1.0.0_amd64.deb
```

**AppImage:**
```bash
chmod +x Clipboard.Sync_1.0.0_amd64.AppImage
./Clipboard.Sync_1.0.0_amd64.AppImage
```

## Features

- **Universal clipboard** — copy text, code, URLs, and images across devices
- **End-to-end encryption** — AES-256-GCM, encrypted before it leaves your device
- **Clipboard history** — access your last 20 clips
- **Instant pairing** — share a code, no account needed
- **Cross-platform** — native apps for macOS, Windows, and Linux
- **Lightweight** — under 10MB, built with Tauri and Rust

## How it works

1. Open the app → click **Create Group**
2. Share the pairing code with your other devices
3. Enter the code on those devices → clipboard syncing starts instantly

The pairing code includes your encryption key. The server only ever sees encrypted data.

## Security

All clipboard data is encrypted with **AES-256-GCM** on your device before transmission. The encryption key is generated locally and embedded in the pairing code — it never touches the server. The server is a zero-knowledge relay that stores only encrypted blobs.

## Build from source

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)

```bash
# Install Rust (if needed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Linux only — install system dependencies
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Build

```bash
git clone https://github.com/Tolaj/clipboard_sync_client.git
cd clipboard_sync_client
npm install
npm run dev        # development mode
npm run build      # production build
```

## Project structure

```
clipboard_sync_client/
├── src/                        # React frontend
│   ├── components/
│   │   ├── PairingScreen.tsx   # Create / join sync group
│   │   ├── ClipboardHistory.tsx
│   │   ├── DeviceList.tsx
│   │   ├── Settings.tsx
│   │   └── LandingPage.tsx     # Browser landing page
│   ├── lib/
│   │   ├── api.ts              # HTTP client
│   │   └── storage.ts          # Persistent storage
│   └── styles/
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── clipboard.rs        # Clipboard monitor + sync
│   │   ├── sync.rs             # Server API client
│   │   ├── crypto.rs           # AES-256-GCM encryption
│   │   ├── commands.rs         # Tauri IPC commands
│   │   └── state.rs            # Shared app state
│   └── tauri.conf.json
└── .github/workflows/
    └── build.yml               # CI/CD for all platforms
```

## Server

The sync server is deployed separately: [clipboard_sync_server](https://github.com/Tolaj/clipboard_sync_server)

A public server is available at `https://clipboard-sync-server.vercel.app` — selected by default in the app.

## License

MIT
