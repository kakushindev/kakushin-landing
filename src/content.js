// ─────────────────────────────────────────────────────────────
//  Everything the page *says* lives here. Layout lives in
//  index.html and src/style.css.
//
//  {{placeholders}} in index.html are filled from this object at
//  build time (see vite.config.js), so the shipped HTML is static.
// ─────────────────────────────────────────────────────────────
export const content = {
  name: 'KAKUSHIN',
  domain: 'kakushin.dev',
  url: 'https://kakushin.dev/',
  title: 'Kakushin — open source, redrawn',
  description:
    'Kakushin (革新) is a small open-source organization. We build tools and libraries that redraw the default.',

  kanji: '革新',
  kanjiReading: 'kakushin: innovation, reform',
  tagline: 'Redraw the default.',

  about: [
    'Kakushin (革新) means reform: the act of redrawing something that already exists.',
    'We are a small open-source organization. We build tools and libraries that question the default way of doing things, and we publish them under permissive licenses.',
    'Everything here is a work in progress. That is the point.',
  ],

  // Menu items, top to bottom. `hint` is the flavour text that types
  // out under the menu when an item is pointed at.
  links: [
    { label: 'ABOUT', href: '#about', hint: 'who we are, and why the name' },
    { label: 'GITHUB', href: 'https://github.com/al-dioooo', hint: 'code, issues, pull requests' },
    // TODO: placeholder address. Replace with the real contact.
    { label: 'EMAIL', href: 'mailto:hello@kakushin.dev', hint: 'hello@kakushin.dev' },
  ],

  year: 2026,
};
