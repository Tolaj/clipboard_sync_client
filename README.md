# Clipboard Sync — Desktop & Mobile App

Cross-device clipboard sharing app built with [Tauri v2](https://v2.tauri.app/) and React. Copy on any device, paste on any other — seamlessly.

Works on **macOS, Windows, Linux, Android, and iOS** from a single codebase.

## How It Works

1. Launch the app on your first device → creates a sync group with a 6-character pairing code
2. Enter the code on your other devices → they join the group
3. Copy anything → it appears on all your devices within 2 seconds

The app runs a background process that monitors your clipboard and syncs changes through the [Clipboard Sync Server](https://github.com/YOUR_USERNAME/clipboard-sync-server).

## Features

- Automatic clipboard sync across all paired devices
- 6-character pairing codes (no accounts needed)
- Clipboard history
- System tray / menu bar integration
- Dark theme UI
- 18MB native binary (no Electron bloat)

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific dependencies (see below)
- A running [Clipboard Sync Server](https://github.com/YOUR_USERNAME/clipboard-sync-server)

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, restart your terminal or run:

```bash
source "$HOME/.cargo/env"
```

### macOS

Xcode Command Line Tools (you likely already have these):

```bash
xcode-select --install
```

### Windows

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11)

### Linux

```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel

# Arch
sudo pacman -S webkit2gtk-4.1 libappindicator-gtk3 librsvg
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/clipboard-sync.git
cd clipboard-sync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

You need the [Clipboard Sync Server](https://github.com/YOUR_USERNAME/clipboard-sync-server) running. Follow its README to set it up, then:

```bash
cd clipboard-sync-server
npm run dev
# Server runs at http://localhost:3000
```

### 4. Run the app in development mode

```bash
cd clipboard-sync
npm run dev
```

This will:
- Start the Vite dev server (hot reload for the React UI)
- Compile and launch the Tauri app

The first build takes a few minutes (compiling Rust dependencies). Subsequent builds are fast.

### 5. Pair your devices

1. The app opens to the pairing screen
2. Set the **Server URL** to your server (e.g., `http://localhost:3000` or your Vercel URL)
3. Enter a **Device Name** (e.g., "My MacBook")
4. Click **Create New Group**
5. You'll see a 6-character code — enter this on your other devices

## Build for Production

```bash
npm run build
```

The built app is at:
- **macOS:** `src-tauri/target/release/bundle/dmg/`
- **Windows:** `src-tauri/target/release/bundle/msi/`
- **Linux:** `src-tauri/target/release/bundle/deb/` or `appimage/`

## Build for Mobile

### Android

```bash
# Add Android target
rustup target add aarch64-linux-android

# Initialize Android project
npx tauri android init

# Run on connected device
npx tauri android dev

# Build APK
npx tauri android build
```

### iOS

```bash
# Add iOS target
rustup target add aarch64-apple-ios

# Initialize iOS project
npx tauri ios init

# Run on simulator
npx tauri ios dev

# Build
npx tauri ios build
```

## Project Structure

```
clipboard-sync/
├── src/                          # React frontend
│   ├── components/
│   │   ├── PairingScreen.tsx     # Create / join sync group
│   │   ├── ClipboardHistory.tsx  # Synced clip history
│   │   ├── DeviceList.tsx        # Paired devices
│   │   └── Settings.tsx          # App settings
│   ├── lib/
│   │   ├── api.ts                # HTTP client for server
│   │   └── storage.ts            # Persistent storage wrapper
│   ├── styles/
│   │   └── global.css            # Dark theme styles
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # App entry point
│   │   ├── lib.rs                # Tauri builder setup
│   │   ├── clipboard.rs          # Clipboard monitor + sync loops
│   │   ├── sync.rs               # HTTP client for server API
│   │   ├── commands.rs           # IPC commands (frontend ↔ backend)
│   │   └── state.rs              # Shared app state
│   ├── capabilities/
│   │   └── default.json          # Tauri v2 permissions
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## How Sync Works

```
┌─────────────┐    POST /api/clip     ┌──────────────┐
│  Device A   │ ─────────────────────▶│              │
│  (copies)   │                       │   Server     │
└─────────────┘                       │  (Vercel +   │
                                      │   MongoDB)   │
┌─────────────┐    GET /clip/latest   │              │
│  Device B   │ ◀─────────────────────│              │
│  (pastes)   │    (polls every 1.5s) └──────────────┘
└─────────────┘
```

- **Outbound:** Rust monitors clipboard every 500ms. On change → hashes content → POSTs to server
- **Inbound:** Polls server every 1.5s. New clip found → writes to local clipboard
- **Dedup:** SHA-256 hash prevents duplicates. A `self_write_in_progress` flag prevents infinite echo loops

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

ISC
