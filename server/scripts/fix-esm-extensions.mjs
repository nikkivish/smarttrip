#!/usr/bin/env node
/**
 * Rewrites relative import specifiers in the compiled output to include the `.js`
 * extension.
 *
 * tsconfig uses `moduleResolution: "bundler"`, which is convenient for authoring
 * (`tsx` and the Metro bundler both resolve extensionless paths) but it tells
 * TypeScript not to emit extensions. Node's ESM loader requires them, so a plain
 * `tsc` build produces `import './app'` and fails at runtime with
 * ERR_MODULE_NOT_FOUND. This runs after `tsc` and patches the emitted files.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Import/export specifiers: `from './x'`, `import('./x')`, `export * from './x'`. */
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bexport\s*\*\s*from\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
};

/**
 * `./enums.ts` compiles to `./enums.js`, and Prisma's generated client writes its
 * imports with the `.ts` extension, so that case has to be rewritten too.
 */
const toJsSpecifier = (spec) => (spec.endsWith('.ts') ? `${spec.slice(0, -3)}.js` : `${spec}.js`);

let patched = 0;

for (const file of walk(dist)) {
  const source = readFileSync(file, 'utf8');

  const next = source.replace(SPECIFIER, (match, prefix, quote, spec) => {
    // Already a runtime specifier Node can resolve as-is.
    if (/\.(js|json|node|mjs|cjs)$/.test(spec)) return match;
    return `${prefix}${quote}${toJsSpecifier(spec)}${quote}`;
  });

  if (next !== source) {
    writeFileSync(file, next);
    patched += 1;
  }
}

console.log(`[fix-esm-extensions] patched ${patched} file(s) in dist/`);
