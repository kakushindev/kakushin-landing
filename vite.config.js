import { defineConfig } from 'vite';
import { content } from './src/content.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Fills {{placeholders}} in index.html from src/content.js at build time
 * (and in the dev server), so the shipped HTML is fully static and the
 * words live in exactly one file.
 */
function contentPlugin() {
  const fields = Object.fromEntries(
    Object.entries(content)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([k, v]) => [k, escapeHtml(v)]),
  );
  fields.menu = content.links
    .map((l) => `<li><a href="${escapeHtml(l.href)}" data-hint="${escapeHtml(l.hint)}">${escapeHtml(l.label)}</a></li>`)
    .join('\n          ');
  fields.about = content.about.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n            ');

  return {
    name: 'kakushin-content',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in fields ? fields[key] : match)),
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [contentPlugin()],
});
