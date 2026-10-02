import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const failures = [];
const notes = [];

const read = (name) => readFileSync(join(DIST, name), 'utf8');

const jsDir = join(DIST, '_expo', 'static', 'js', 'web');
const bundles = readdirSync(jsDir).filter((f) => f.endsWith('.js'));
if (bundles.length === 0) failures.push('no web bundle found in _expo/static/js/web');

const bundle = bundles.map((f) => readFileSync(join(jsDir, f), 'utf8')).join('\n');
notes.push(`bundles: ${bundles.join(', ')} (${statSync(join(jsDir, bundles[0])).size} bytes)`);

const expected = process.env.EXPO_PUBLIC_API_URL;
if (!expected) {
  failures.push('EXPO_PUBLIC_API_URL is not set, so the build cannot be verified');
} else {
  const normalized = expected.replace(/\/$/, '');
  const hits = bundle.split(normalized).length - 1;
  if (hits === 0) {
    failures.push(`API URL ${normalized} does not appear in the bundle (stale transform cache?)`);
  } else {
    notes.push(`API URL ${normalized} inlined ${hits}x`);
  }

  for (const stale of ['http://localhost:4000/api/v1', 'http://10.0.2.2:4000/api/v1']) {
    if (stale !== normalized && bundle.includes(stale)) {
      failures.push(`bundle still references ${stale}, so it is not pointed at ${normalized}`);
    }
  }
}

try {
  const redirects = read('_redirects').trim();
  if (redirects !== '/*  /index.html  200') {
    failures.push(`unexpected _redirects contents: ${JSON.stringify(redirects)}`);
  } else {
    notes.push('_redirects: SPA fallback present');
  }
} catch {
  failures.push('missing dist/_redirects');
}

try {
  const index = read('index.html');
  const notFound = read('404.html');
  if (index !== notFound) failures.push('404.html does not match index.html');
  else notes.push('404.html matches index.html');
} catch {
  failures.push('missing dist/index.html or dist/404.html');
}

for (const note of notes) console.log(`  ${note}`);
for (const failure of failures) console.error(`  FAIL ${failure}`);

if (failures.length > 0) {
  console.error(`\nweb build verification failed (${failures.length} problem(s))`);
  process.exit(1);
}

console.log('\nweb build verified: API URL inlined, SPA fallback present, no dev URLs.');