// Renders the social and icon images into public/:
//   og.png               1200x630  Open Graph / Twitter card
//   apple-touch-icon.png  180x180  iOS bookmark icon
//   icon-512.png          512x512  web manifest icon
//
// Uses a local Chromium over the DevTools protocol (no extra npm packages).
// Set CHROME=/path/to/chrome if auto-detection fails. Run: npm run og
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rough from 'roughjs/bundled/rough.esm.js';
import { content } from '../src/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#c8102e';
const SELECT = '#053d7c';

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  if (fs.existsSync(cache)) {
    for (const dir of fs.readdirSync(cache).filter((n) => n.startsWith('chromium-')).sort().reverse()) {
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const p = path.join(cache, dir, sub);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  for (const bin of ['google-chrome', 'chromium', 'chromium-browser']) {
    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      const p = path.join(dir, bin);
      if (fs.existsSync(p)) return p;
    }
  }
  throw new Error('No Chromium found. Set CHROME=/path/to/chrome and rerun.');
}

// Fonts are inlined so the page needs no server and no network.
const fontFace = (family, file, extra = '') => {
  const b64 = fs.readFileSync(path.join(root, 'node_modules', file)).toString('base64');
  return `@font-face{font-family:'${family}';font-weight:${family === 'Cabin Sketch' ? 700 : 400};src:url(data:font/woff2;base64,${b64}) format('woff2');${extra}}`;
};
const fonts = [
  fontFace('Cabin Sketch', '@fontsource/cabin-sketch/files/cabin-sketch-latin-700-normal.woff2'),
  fontFace('Patrick Hand', '@fontsource/patrick-hand/files/patrick-hand-latin-400-normal.woff2'),
  fontFace('Zen Kurenaido', '@fontsource/zen-kurenaido/files/zen-kurenaido-96-400-normal.woff2', 'unicode-range:U+9769;'),
  fontFace('Zen Kurenaido', '@fontsource/zen-kurenaido/files/zen-kurenaido-117-400-normal.woff2', 'unicode-range:U+65B0;'),
].join('\n');

// Rough.js drawings as static SVG paths. Fixed seeds keep the image reproducible.
const gen = rough.generator();
const toSvg = (drawable) =>
  gen.toPaths(drawable)
    .map((p) => `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
const seal = toSvg(gen.rectangle(9, 9, 82, 82, {
  seed: 20260910, roughness: 2.6, bowing: 2, stroke: INK, strokeWidth: 2.4,
  fill: INK, fillStyle: 'hachure', hachureAngle: -38, hachureGap: 8, fillWeight: 0.7,
}));
const rule = [0, 1].map((i) => toSvg(gen.line(0, 3 + i * 6, 1056, 3 + i * 6, { seed: 4242 + i, roughness: 1.2, stroke: '#fff', strokeWidth: 1.6 }))).join('');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const host = new URL(content.url).host;

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
html,body{margin:0;background:#000;color:#fff}
.card{position:relative;width:1200px;height:630px;box-sizing:border-box;padding:56px 72px;overflow:hidden;font-family:'Patrick Hand',sans-serif}
h1{margin:0;font-family:'Cabin Sketch';font-weight:700;font-size:170px;line-height:.95;letter-spacing:.03em}
.tag{margin:22px 0 0 4px;font-size:46px;letter-spacing:.08em;text-transform:uppercase}
.rule{position:absolute;left:72px;top:330px;width:1056px;height:12px}
.rule svg{width:1056px;height:12px;overflow:visible}
.menu{position:absolute;left:146px;top:366px;font-size:44px;letter-spacing:.1em;line-height:1.4}
.menu div{width:max-content}
.menu .sel{background:${SELECT};padding:0 16px;margin-left:-16px}
.seal{position:absolute;right:104px;top:352px;width:232px;height:232px;transform:rotate(-7deg)}
.seal svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.seal span{position:absolute;inset:0;display:grid;place-items:center;font-family:'Zen Kurenaido';font-size:92px;line-height:1;writing-mode:vertical-rl;letter-spacing:.04em;color:${INK};text-shadow:0 0 2px #000,0 0 2px #000,1px 1px 0 #000,-1px -1px 0 #000}
.url{position:absolute;left:72px;bottom:44px;font-size:30px;letter-spacing:.04em;color:#9ca3af}
</style></head><body><div class="card">
<h1>${esc(content.name)}</h1>
<div class="tag">${esc(content.tagline)}</div>
<div class="rule"><svg viewBox="0 0 1056 12">${rule}</svg></div>
<div class="menu">${content.links.map((l, i) => `<div${i === 1 ? ' class="sel"' : ''}>${esc(l.label)}</div>`).join('')}</div>
<div class="seal"><svg viewBox="0 0 100 100">${seal}</svg><span lang="ja">${esc(content.kanji)}</span></div>
<div class="url">${esc(host)}</div>
</div></body></html>`;

const favicon = fs.readFileSync(path.join(root, 'public', 'favicon.svg'), 'utf8');
const iconHtml = (size) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000}img{display:block;width:${size}px;height:${size}px}
</style></head><body><img src="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"></body></html>`;

// --- minimal DevTools client ------------------------------------------------
const PORT = 9335;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kakushin-og-'));
const chrome = spawn(findChrome(), [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
  '--hide-scrollbars', '--allow-file-access-from-files', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }); if (r.ok) target = await r.json(); } catch {}
    if (!target) await wait(250);
  }
  if (!target) throw new Error('Chromium did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');

  async function render(html, width, height, file) {
    const tmp = path.join(profile, `${path.basename(file, '.png')}.html`);
    fs.writeFileSync(tmp, html);
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `file://${tmp}` });
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))', awaitPromise: true });
    const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
    fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
    console.log(`wrote ${path.relative(root, file)} (${width}x${height}, ${(fs.statSync(file).size / 1024).toFixed(0)} kB)`);
  }

  await render(ogHtml, 1200, 630, path.join(root, 'public', 'og.png'));
  await render(iconHtml(180), 180, 180, path.join(root, 'public', 'apple-touch-icon.png'));
  await render(iconHtml(512), 512, 512, path.join(root, 'public', 'icon-512.png'));
  ws.close();
} finally {
  chrome.kill('SIGTERM');
  await new Promise((r) => { chrome.once('exit', r); setTimeout(r, 3000); });
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
