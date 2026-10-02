/**
 * Static hosts serve files by path, but an expo-router web export is a single
 * page: every route resolves to the same index.html. Without a rewrite rule a
 * refresh on /home or /explore (or any shared link) returns 404.
 *
 * `_redirects` is understood by Netlify, Cloudflare Pages and Render Static
 * Sites. `404.html` is a copy of the app shell for hosts that serve it as the
 * fallback for unknown paths. Run automatically by `npm run build:web`.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const INDEX = path.join(DIST, 'index.html');

if (!fs.existsSync(INDEX)) {
  console.error(`No build found at ${INDEX}. Run the export first.`);
  process.exit(1);
}

const REWRITES = '/*  /index.html  200\n';

fs.writeFileSync(path.join(DIST, '_redirects'), REWRITES);
fs.copyFileSync(INDEX, path.join(DIST, '404.html'));

console.log('Wrote dist/_redirects and dist/404.html (SPA fallback ready).');