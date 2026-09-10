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

  // Structured data: one Organization, its WebSite, and this WebPage.
  const org = `${content.url}#organization`;
  const site = `${content.url}#website`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: content.orgName,
        alternateName: content.kanji,
        url: content.url,
        description: content.description,
        logo: { '@type': 'ImageObject', url: `${content.url}icon-512.png`, width: 512, height: 512 },
        sameAs: content.links.map((l) => l.href).filter((h) => /^https:\/\/github\.com\//.test(h)),
      },
      { '@type': 'WebSite', '@id': site, url: content.url, name: content.orgName, inLanguage: 'en', publisher: { '@id': org } },
      {
        '@type': 'WebPage',
        '@id': content.url,
        url: content.url,
        name: content.title,
        description: content.description,
        inLanguage: 'en',
        isPartOf: { '@id': site },
        about: { '@id': org },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${content.url}og.png`, width: 1200, height: 630 },
      },
    ],
  };
  fields.jsonld = JSON.stringify(jsonld).replace(/</g, '\\u003c');

  // Small crawler-facing files generated from the same content object.
  const extraFiles = {
    'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${content.url}sitemap.xml\n`,
    'sitemap.xml':
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      `  <url>\n    <loc>${content.url}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n  </url>\n` +
      '</urlset>\n',
    'site.webmanifest':
      JSON.stringify(
        {
          name: content.orgName,
          short_name: content.orgName,
          description: content.description,
          start_url: '/',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
            { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        null,
        2,
      ) + '\n',
  };
  const types = { txt: 'text/plain', xml: 'application/xml', webmanifest: 'application/manifest+json' };

  return {
    name: 'kakushin-content',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in fields ? fields[key] : match)),
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(extraFiles)) this.emitFile({ type: 'asset', fileName, source });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url || '').split('?')[0].slice(1);
        if (!(name in extraFiles)) return next();
        res.setHeader('Content-Type', types[name.split('.').pop()] + '; charset=utf-8');
        res.end(extraFiles[name]);
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [contentPlugin()],
});
