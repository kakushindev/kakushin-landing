# kakushin.dev

Landing page for **Kakushin (革新)**, an open-source project organization.

Hand-drawn look built with [wired-elements](https://wiredjs.com) and [Rough.js](https://roughjs.com),
in the spirit of a certain black-and-white RPG title screen. No framework, no runtime CDN:
fonts and libraries are bundled by Vite.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # -> dist/
npm run preview   # serve dist/ locally
```

Requires Node 22.12 or newer.

## Edit the words

Everything the page says is in [`src/content.js`](src/content.js): name, tagline, about text,
menu links and their hover hints. `{{placeholders}}` in `index.html` are filled from that file at
build time by the small plugin in `vite.config.js`, so the shipped HTML is fully static.

Layout and colours live in `src/style.css`; the drawings (the 革新 stamp, the menu hand) in
`src/sketch.js`; behaviour in `src/main.js`.

## Deploy

Any static host works. For Cloudflare Pages:

| Setting          | Value           |
| ---------------- | --------------- |
| Build command    | `npm run build` |
| Output directory | `dist`          |
| Node version     | `22`            |

## Why these versions

- `wired-elements` 3.0.0-rc.6 is the newest release on npm. It calls a Rough.js filler API that was
  renamed in Rough.js 4.5, so `roughjs` is pinned to 4.3.1 (one copy, shared with our own drawings).
- `roughjs` is imported from `roughjs/bundled/rough.esm.js` because the package's browser entry is a
  UMD build without an ES default export.
- Do not add `lit` directly; wired-elements brings its own Lit 2 and a second copy would break dedupe.

## Small things

- **WHITE SPACE / BLACK SPACE** toggle in the footer inverts the page and is remembered per browser.
- **SFX** is off by default. When on, menu blips are synthesized with Web Audio; no audio files ship.
- Every animation is disabled under `prefers-reduced-motion`.
- Arrow keys walk the menu, Enter follows the link.
- Fonts are self-hosted via Fontsource: Cabin Sketch, Patrick Hand, Zen Kurenaido (SIL Open Font License).
