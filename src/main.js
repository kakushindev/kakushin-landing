// kakushin.dev title screen.
// Order matters: fonts and the wired components load first, then our styles.
import '@fontsource/patrick-hand/latin-400.css';
import '@fontsource/cabin-sketch/700.css';
// Zen Kurenaido (for 革新) is declared in style.css: only the two subset
// slices that contain those glyphs ship, instead of the package's 120.
import 'wired-elements/lib/wired-card.js';
import 'wired-elements/lib/wired-divider.js';
import 'wired-elements/lib/wired-toggle.js';
import 'wired-elements/lib/wired-checkbox.js';
import './style.css';
import { drawHand, drawStamp, randomSeed } from './sketch.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const WIRED = 'wired-card, wired-divider, wired-toggle, wired-checkbox';

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode, blocked storage: fine, just not remembered */
    }
  },
};

/* ── typewriter ───────────────────────────────────────────── */
// RPG dialogue reveal. A hidden spacer keeps the layout while a clipped
// copy widens in steps(n) (see .type in style.css).
function typewrite(el, text, secondsPerChar = 0.045) {
  el.replaceChildren();
  if (!text) return;
  const spacer = document.createElement('span');
  spacer.className = 'type-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  spacer.textContent = text;
  const live = document.createElement('span');
  live.className = 'type-text';
  live.textContent = text;
  el.style.setProperty('--characterCount', String(text.length));
  el.style.setProperty('--type-duration', `${Math.max(0.3, text.length * secondsPerChar).toFixed(2)}s`);
  el.append(spacer, live);
}

/* ── sound, opt-in ────────────────────────────────────────── */
let audio = null;
let sfxOn = store.get('kakushin-sfx') === '1';

function blip(freq = 880, length = 0.06) {
  if (!sfxOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  } catch {
    /* no audio device, no problem */
  }
}
// Browsers only let audio start after a gesture; resume on the first one.
for (const type of ['pointerdown', 'keydown']) {
  window.addEventListener(type, () => audio?.state === 'suspended' && audio.resume(), { passive: true });
}

/* ── living sketches ──────────────────────────────────────── */
// Each wired element picks one random seed for life. Handing it a new
// one on hover redraws the ink, like the next frame of a flipbook.
function resketch(el) {
  if (typeof el.wiredRender !== 'function') return;
  el.seed = randomSeed();
  el.wiredRender(true);
}

function liveSketches() {
  if (reduceMotion.matches) return;
  for (const el of $$(WIRED)) {
    let last = 0;
    el.addEventListener('pointerenter', () => {
      const now = performance.now();
      if (now - last < 150) return;
      last = now;
      resketch(el);
    });
  }
}

/* ── the 革新 stamp ───────────────────────────────────────── */
function stamp() {
  const box = $('#stamp');
  const svg = $('#stamp-ink');
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#c8102e';
  const reink = () => drawStamp(svg, { ink });
  reink();
  box.addEventListener('click', () => {
    reink();
    blip(660, 0.08);
  });
  if (!reduceMotion.matches) {
    setInterval(() => {
      if (!document.hidden) reink();
    }, 4000);
  }
}

/* ── title-screen menu ────────────────────────────────────── */
function menu() {
  const nav = $('#menu');
  const links = $$('.menu-list a', nav);
  const hand = $('.hand', nav);
  const hint = $('#hint');
  drawHand(hand);

  let current = null;

  function moveHand(link) {
    const y = link.offsetTop + link.offsetHeight / 2 - hand.getBoundingClientRect().height / 2;
    nav.style.setProperty('--hand-y', `${Math.round(y)}px`);
  }

  function select(link) {
    if (link === current) return;
    current = link;
    moveHand(link);
    nav.classList.add('is-active');
    const text = link.dataset.hint ? `* ${link.dataset.hint}` : '';
    if (reduceMotion.matches) hint.textContent = text;
    else typewrite(hint, text);
    blip(880);
  }

  for (const link of links) {
    link.addEventListener('pointerenter', () => select(link));
    link.addEventListener('focus', () => select(link));
    link.addEventListener('click', () => blip(1320, 0.09));
  }

  // Arrow keys walk the menu like a title screen; Enter follows the link natively.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const index = links.indexOf(document.activeElement);
    const onBody = document.activeElement === document.body || document.activeElement === null;
    if (index === -1 && !(onBody && event.key === 'ArrowDown')) return;
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = index === -1 ? 0 : (index + step + links.length) % links.length;
    links[next].focus();
  });

  window.addEventListener('resize', () => current && moveHand(current));
}

// wired-toggle and wired-checkbox wrap a real <input> in their shadow DOM;
// that input is what keyboards and screen readers reach, so name it there.
async function labelInner(el, label) {
  await el.updateComplete;
  el.shadowRoot?.querySelector('input')?.setAttribute('aria-label', label);
}

/* ── WHITE SPACE / BLACK SPACE ────────────────────────────── */
async function spaceToggle() {
  const root = document.documentElement;
  const toggle = $('#space');
  const meta = $('meta[name="theme-color"]');

  const apply = (white, persist) => {
    if (white) root.dataset.space = 'white';
    else delete root.dataset.space;
    if (meta) meta.content = white ? '#ffffff' : '#000000';
    if (persist) store.set('kakushin-space', white ? 'white' : 'black');
  };

  await customElements.whenDefined('wired-toggle');
  await labelInner(toggle, 'White space');
  toggle.checked = root.dataset.space === 'white';
  apply(toggle.checked, false);
  toggle.addEventListener('change', (event) => {
    const white = Boolean(event.detail?.checked ?? toggle.checked);
    apply(white, true);
    blip(white ? 1100 : 550, 0.08);
  });
}

/* ── SFX switch ───────────────────────────────────────────── */
async function sfxToggle() {
  const box = $('#sfx');
  await customElements.whenDefined('wired-checkbox');
  await labelInner(box, 'Sound effects');
  box.checked = sfxOn;
  box.addEventListener('change', (event) => {
    sfxOn = Boolean(event.detail?.checked ?? box.checked);
    store.set('kakushin-sfx', sfxOn ? '1' : '0');
    if (sfxOn) blip(1320, 0.09); // the click that enabled it is the gesture
  });
}

/* ── boot ─────────────────────────────────────────────────── */
async function boot() {
  const tagline = $('#tagline');
  if (!reduceMotion.matches) typewrite(tagline, tagline.textContent.trim(), 0.05);

  stamp();
  menu();
  spaceToggle();
  sfxToggle();

  // Once the web fonts are in, metrics change: redraw every sketch to the final layout.
  await Promise.all([customElements.whenDefined('wired-card'), document.fonts?.ready ?? Promise.resolve()]);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  for (const el of $$(WIRED)) el.wiredRender?.(true);
  liveSketches();
}

boot();
