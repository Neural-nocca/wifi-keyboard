# WiFi Keyboard

Send text from iPhone to Windows PC over local Wi-Fi.

Type on your phone — text gets pasted into the active window on your computer via clipboard.

## How it works

```
iPhone (Safari)          Wi-Fi           Windows PC
┌──────────────┐                    ┌──────────────────┐
│  textarea +  │    WebSocket       │  Node.js server   │
│  "Надіслати" │ ────────────────→  │  ↓                │
│              │                    │  base64 → UTF-8   │
│  PWA-capable │  ← status ok/err  │  → Set-Clipboard   │
└──────────────┘                    │  → Ctrl+V (paste) │
                                    └──────────────────┘
```

1. iPhone opens a web page served by the Node.js server
2. User types text and taps "Надіслати" (Send)
3. Text is sent via WebSocket to the server
4. Server encodes text as base64 (to preserve Unicode/Cyrillic), decodes it in PowerShell, copies to clipboard, and simulates Ctrl+V

## Requirements

- **Windows** 10/11 with PowerShell
- **Node.js** v18+
- **iPhone** (or any device with a browser) on the same Wi-Fi network

## Setup

```bash
git clone https://github.com/Neural-nocca/wifi-keyboard.git
cd wifi-keyboard
npm install
```

## Usage

```powershell
# Run from Windows PowerShell (not WSL!)
node server.js
```

Server will print the local IP address:

```
→ http://192.168.50.10:9877
→ http://localhost:9877
```

Open the IP address on your iPhone in Safari. Type text, tap send — it appears on your PC.

### Save as PWA on iPhone

1. Open the URL in Safari
2. Tap Share (□↑) → Add to Home Screen
3. Now it works as a fullscreen app without the browser bar

## Firewall

If iPhone can't connect, add a firewall rule (PowerShell as Admin):

```powershell
New-NetFirewallRule -DisplayName "WiFi Keyboard (port 9877)" `
  -Direction Inbound -Protocol TCP -LocalPort 9877 -Action Allow -Profile Any
```

## Security

- Only use on **trusted home Wi-Fi** — anyone on the same network can send text
- Traffic is **not encrypted** (HTTP) — Safari will show "Not Secure"
- **Stop the server** (Ctrl+C) when you're done

## Project structure

```
wifi-keyboard/
├── server.js          # HTTP + WebSocket server, clipboard paste logic
├── public/
│   ├── index.html     # PWA keyboard UI
│   └── manifest.json  # PWA manifest (fullscreen, app name)
├── package.json
└── .gitignore
```

## Authors

**Neural-nocca** — concept, research, testing, debugging (WSL/Windows networking, firewall, Unicode encoding)

**Claude Opus 4.6** (Anthropic, `claude-opus-4-6`) — co-author, implementation
