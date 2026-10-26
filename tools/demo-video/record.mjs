// Records the Cadence demo walkthrough to cadence-demo.mp4.
// Frames come from the CDP screencast (sharper than Playwright's built-in
// video), then ffmpeg stitches them with their real timings.
//
//   npm install && npm run record
//   BASE=http://localhost:5173 npm run record   (record a local dev server)
import { chromium } from 'playwright-core';
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
process.chdir(HERE);
const BASE = (process.env.BASE || 'https://cadence-delta-five.vercel.app').replace(/\/$/, '');
const OUT = path.join(HERE, 'frames');
const VIDEO = path.join(HERE, 'cadence-demo.mp4');
// Screencast frames come out at CSS-pixel size (deviceScaleFactor is ignored),
// so record a native 1080p viewport.
const W = 1920, H = 1080, DPR = 1;

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const pw = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.cache'), 'ms-playwright');
  if (fs.existsSync(pw)) {
    const dirs = fs.readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
    for (const d of dirs) {
      const exe = path.join(pw, d, 'chrome-win64', 'chrome.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  const installed = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(p => fs.existsSync(p));
  if (installed) return installed;
  throw new Error('No Chromium found. Set CHROME=<path to chrome.exe>.');
}
function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { execSync('ffmpeg -version', { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  try { return execSync('python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"').toString().trim(); } catch {}
  throw new Error('No ffmpeg found. Install it or set FFMPEG=<path to ffmpeg.exe>.');
}
const CHROME = findChrome();
const FFMPEG = findFfmpeg();
console.log('Recording', BASE, 'with', CHROME);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, colorScheme: 'light' });

// Fake cursor + click ripple + caption bar, re-installed on every document.
await context.addInitScript(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const st = document.createElement('style');
    st.textContent = `
      #__demo_cursor { position: fixed; z-index: 2147483647; left: 0; top: 0; width: 22px; height: 22px; pointer-events: none;
        transform: translate(-100px, -100px); transition: transform 0s; }
      #__demo_cursor svg { filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
      .__demo_ripple { position: fixed; z-index: 2147483646; width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%;
        border: 2px solid rgba(7,76,224,.85); pointer-events: none; animation: __rip 520ms ease-out forwards; }
      @keyframes __rip { from { transform: scale(.3); opacity: 1 } to { transform: scale(1.5); opacity: 0 } }
      #__demo_caption { position: fixed; z-index: 2147483645; left: 50%; bottom: 46px; transform: translate(-50%, 18px); opacity: 0;
        min-width: 640px; max-width: 1500px; padding: 24px 44px 28px; border-radius: 24px; text-align: center; pointer-events: none;
        background: rgba(12, 14, 18, .94); color: #fff;
        box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 24px 60px -16px rgba(0,0,0,.6);
        font-family: 'Host Grotesk', 'Instrument Sans', system-ui, sans-serif;
        transition: opacity 280ms ease, transform 360ms cubic-bezier(.2,.8,.2,1); }
      #__demo_caption.on { opacity: 1; transform: translate(-50%, 0); }
      #__demo_caption .k { display: block; margin-bottom: 10px; font-size: 17px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #8fb0ff; }
      #__demo_caption .t { display: block; font-size: 50px; line-height: 1.1; font-weight: 700; letter-spacing: -.03em; white-space: nowrap; }
      #__demo_caption .s { display: block; margin-top: 10px; font-size: 24px; line-height: 1.35; font-weight: 500; color: rgba(255,255,255,.74); white-space: nowrap; }
      #__demo_end { position: fixed; inset: 0; z-index: 2147483644; display: grid; place-items: center; background: #fcfcfd; opacity: 0;
        transition: opacity 600ms ease; pointer-events: none; font-family: 'Host Grotesk', system-ui, sans-serif; color: #16191f; text-align: center; }
      #__demo_end.on { opacity: 1; }
      #__demo_end h1 { text-transform: none; text-shadow: none; font-size: 64px; font-weight: 700; letter-spacing: -.04em; margin: 0; }
      #__demo_end p { font-size: 22px; color: #454c58; margin: 14px 0 0; }
      #__demo_end .url { display: inline-block; margin-top: 26px; padding: 12px 22px; border-radius: 10px; background: #074ce0; color: #fff; font-size: 20px; font-weight: 600; }
    `;
    document.documentElement.appendChild(st);
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l15 11.5-6.6 1.1 3.9 6.9-2.9 1.6-3.9-7L4 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    const cap = document.createElement('div');
    cap.id = '__demo_caption';
    document.documentElement.appendChild(cap);
    const end = document.createElement('div');
    end.id = '__demo_end';
    document.documentElement.appendChild(end);
    const pos = window.__demoPos || { x: -100, y: -100 };
    c.style.transform = `translate(${pos.x - 3}px, ${pos.y - 2}px)`;
    document.addEventListener('mousemove', e => {
      window.__demoPos = { x: e.clientX, y: e.clientY };
      c.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 2}px)`;
    }, true);
    document.addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.className = '__demo_ripple';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.documentElement.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  window.__caption = (t, sub, kicker) => {
    const cap = document.getElementById('__demo_caption');
    if (!cap) return;
    const fill = () => {
      cap.innerHTML = (kicker ? `<span class="k">${kicker}</span>` : '') + `<span class="t">${t}</span>` + (sub ? `<span class="s">${sub}</span>` : '');
      cap.classList.add('on');
    };
    if (!t) { cap.classList.remove('on'); return; }
    if (cap.classList.contains('on')) { cap.classList.remove('on'); setTimeout(fill, 260); } else fill();
  };
  window.__end = (html) => {
    const e = document.getElementById('__demo_end'); e.innerHTML = html; e.classList.add('on');
    document.getElementById('__demo_cursor').style.display = 'none';
  };
});

const page = await context.newPage();
page.setDefaultTimeout(8000);
const cdp = await context.newCDPSession(page);
const frames = [];
let n = 0;
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = path.join(OUT, `f${String(n++).padStart(6, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
});

const sleep = ms => page.waitForTimeout(ms);
let mouse = { x: W / 2, y: H / 2 };
async function moveTo(x, y, ms = 650) {
  const steps = Math.max(10, Math.round(ms / 28));
  const sx = mouse.x, sy = mouse.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e);
    await page.waitForTimeout(16);
  }
  mouse = { x, y };
}
async function point(locator, ms) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  if (!b) throw new Error('no box for ' + locator);
  await moveTo(b.x + b.width / 2, b.y + b.height / 2, ms);
  return el;
}
async function click(locator, { ms = 650, after = 500 } = {}) {
  await point(locator, ms);
  await sleep(120);
  await page.mouse.down(); await sleep(70); await page.mouse.up();
  await sleep(after);
}
const caption = (t, sub, kicker) => page.evaluate(([t, s, k]) => window.__caption(t, s, k), [t, sub, kicker]);
async function dragRange(locator, fraction, ms = 900) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  const val = await el.evaluate(e => (e.value - e.min) / (e.max - e.min));
  const y = b.y + b.height / 2;
  await moveTo(b.x + b.width * val, y, 500);
  await page.mouse.down();
  await moveTo(b.x + b.width * fraction, y, ms);
  await page.mouse.up();
}
async function smoothScroll(y, ms = 1200) {
  await page.evaluate(([y, ms]) => new Promise(res => {
    const start = scrollY, d = y - start, t0 = performance.now();
    const step = now => { const t = Math.min(1, (now - t0) / ms); const e = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; scrollTo(0, start + d * e); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  }), [y, ms]);
}
async function scrollEl(selector, ms = 900) {
  await page.evaluate(([sel, ms]) => new Promise(res => {
    const el = document.querySelector(sel); if (!el) return res();
    const r = el.getBoundingClientRect(); const target = scrollY + r.top - innerHeight / 2 + r.height / 2;
    const start = scrollY, d = target - start, t0 = performance.now();
    const step = now => { const t = Math.min(1, (now - t0) / ms); const e = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; scrollTo(0, start + d * e); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  }), [selector, ms]);
}

// Fresh demo state
await page.goto(BASE + '/');
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await sleep(600);

await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: Math.round(W * DPR), maxHeight: Math.round(H * DPR), everyNthFrame: 1 });
const t0 = Date.now();

// 1. Landing
await page.mouse.move(mouse.x, mouse.y);
await sleep(900);
await caption('Cadence', 'Routines, tasks, calendar and focus — in one calm place', 'Meet');
await sleep(2600);
await click(page.locator('[aria-label^="Switch to"]'), { ms: 550, after: 1300 });
await click(page.locator('[aria-label^="Switch to"]'), { ms: 300, after: 700 });

// 2. Into the demo
await caption('Your whole day on one screen', 'Routines, tasks, goals and events — and what to do next', 'Today');
await click(page.getByRole('button', { name: 'Try the demo' }).or(page.getByRole('link', { name: 'Try the demo' })), { ms: 550, after: 300 });
await page.waitForSelector('.today-header', { timeout: 15000 });
await sleep(1700);
const check = page.locator('[aria-label^="Complete "][aria-label$=" for today"]');
if (await check.count()) await click(check.first(), { ms: 550, after: 1100 });

// 3. Quick add
await scrollEl('#today-quick-add', 700);
await caption('Type it the way you’d say it', 'Cadence works out the date, the time and whether it repeats', '01 · Quick add');
await click(page.locator('#today-quick-add'), { ms: 500, after: 200 });
await page.keyboard.type('Call mom tomorrow 6pm', { delay: 45 });
await sleep(1300);
await page.keyboard.press('Enter');
await sleep(900);
await page.keyboard.type('gym mon wed fri 7am', { delay: 45 });
await sleep(1600);
await page.keyboard.press('Escape');
await page.evaluate(() => document.activeElement?.blur());

// 4. Calendar + integrations
await click(page.locator('.sidebar .nav-item', { hasText: 'Calendar' }), { ms: 600, after: 500 });
await caption('A calendar that already knows your week', 'Routines, timed tasks and your other calendars, side by side', '02 · Calendar');
await sleep(2600);
await click(page.locator('.sidebar .nav-item', { hasText: 'Settings' }), { ms: 600, after: 300 });
await scrollEl('#s-calendars', 800);
await caption('Works with Google, Outlook and Apple', 'Paste a calendar link to bring it in — or subscribe to Cadence from them', '02 · Calendar sync');
await point(page.locator('.settings-section:has(#s-calendars) input[placeholder^="https://calendar.google.com"]'), 600);
await sleep(1500);
await point(page.locator('.settings-section:has(#s-calendars) .settings-row-label', { hasText: 'Show Cadence in your calendar' }), 600);
await sleep(1500);

// 5. Themes
await scrollEl('.theme-picker', 800);
await caption('Nine themes, one click', 'Every screen restyles itself — even the focus clock', '03 · Themes');
for (const name of ['Cyberpunk', 'Claymorphism', 'Sketch', 'Retro', 'Industrial']) {
  await click(page.locator('.theme-card', { hasText: name }), { ms: 380, after: 1150 });
}
await click(page.locator('.theme-card', { hasText: 'Cadence' }), { ms: 380, after: 900 });

// 6. Animated background
await caption('Set the mood', 'Built-in animated scenes behind the app — blur and dim to taste', '04 · Ambient background');
await click(page.locator('[role="switch"][aria-label="Ambient background"]'), { ms: 500, after: 300 });
// lower blur first: a blurred full-screen animation is slow to render headless
await dragRange(page.locator('#ambient-blur'), 0.05, 450);
await dragRange(page.locator('#ambient-dim'), 0.4, 400);
for (const name of ['Aurora', 'Dusk']) {
  await click(page.locator('.scene-card', { hasText: name }), { ms: 380, after: 1100 });
}
await click(page.locator('.sidebar .nav-item', { hasText: 'Today' }), { ms: 500, after: 300 });
await smoothScroll(0, 300);
await sleep(2000);

// 7. Lock In
await caption('Then lock in', 'A distraction-free focus timer, one key away', '05 · Focus');
await click(page.locator('.sidebar .lockin-launch'), { ms: 550, after: 400 });
const opt = page.locator('.dialog button', { hasText: 'Read 20 pages' });
if (await opt.count()) await click(opt, { ms: 450, after: 250 });
await click(page.locator('.dialog button', { hasText: 'Start session' }), { ms: 450, after: 300 });
await sleep(3000);
await caption(null);
await sleep(300);

// End card
await moveTo(W + 40, H / 2, 500);
await page.evaluate(() => window.__end('<div><h1>Cadence</h1><p>Keep a rhythm that fits real life. Free demo, no sign-up.</p><span class="url">cadence-delta-five.vercel.app</span></div>'));
await sleep(3500);

const tStop = Date.now() / 1000;
await cdp.send('Page.stopScreencast');
await sleep(300);
console.log('recorded', frames.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');

// concat list with per-frame durations
const lines = [];
for (let i = 0; i < frames.length; i++) {
  // the last frame holds until recording stopped (the page goes still, so no more frames arrive)
  const d = i < frames.length - 1 ? frames[i + 1].t - frames[i].t : tStop - frames[i].t;
  lines.push(`file '${frames[i].file.replace(/\\/g, '/')}'`, `duration ${Math.max(0.001, d).toFixed(4)}`);
}
lines.push(`file '${frames[frames.length - 1].file.replace(/\\/g, '/')}'`);
fs.writeFileSync('frames.txt', lines.join('\n'));
await browser.close();

const enc = spawnSync(FFMPEG, [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.txt',
  '-vf', 'fps=30,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', VIDEO,
], { stdio: 'inherit' });
if (enc.status !== 0) throw new Error('ffmpeg failed');
console.log('Saved', VIDEO);
