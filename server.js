const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { execSync } = require('child_process');

const PORT = 9877;

const MIME = {
  '.html': 'text/html', '.json': 'application/json',
  '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png'
};

// HTTP-сервер: віддає HTML-клавіатуру для iPhone
const server = http.createServer((req, res) => {
  const file = path.join(__dirname, 'public',
    req.url === '/' ? 'index.html' : req.url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'text/html'
    });
    res.end(data);
  });
});

// Вставити текст в активне вікно Windows (clipboard + Ctrl+V)
function pasteToWindows(text) {
  try {
    // Крок 1: текст → base64 (обхід проблеми кодування UTF-8 в PowerShell stdin)
    const b64 = Buffer.from(text, 'utf-8').toString('base64');
    // Крок 2: PowerShell декодує base64 → UTF-8 → clipboard
    execSync(
      `powershell.exe -Command "$t=[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64}')); Set-Clipboard $t"`,
      { timeout: 5000 }
    );
    // Крок 3: Ctrl+V у активне вікно
    execSync(
      "powershell.exe -Command \"Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Milliseconds 300; [System.Windows.Forms.SendKeys]::SendWait('^v')\"",
      { timeout: 10000 }
    );
    return true;
  } catch (e) {
    console.error('Помилка вставки:', e.message);
    return false;
  }
}

// WebSocket-сервер: приймає текст від iPhone
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('iPhone підключився!');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'text' && msg.content) {
        console.log('← Текст:', msg.content);
        const ok = pasteToWindows(msg.content);
        console.log(ok ? '✓ Вставлено' : '✗ Помилка вставки');
        ws.send(JSON.stringify({ status: ok ? 'ok' : 'error' }));
      }
    } catch (e) {
      console.error('Помилка парсингу:', e.message);
      ws.send(JSON.stringify({ status: 'error', msg: e.message }));
    }
  });

  ws.on('close', () => console.log('iPhone відключився'));
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = require('os').networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`→ http://${net.address}:${PORT}`);
      }
    }
  }
  console.log(`→ http://localhost:${PORT}`);
});
