#!/usr/bin/env node
/**
 * Copies each package's .env.example to .env when a .env does not exist yet.
 * Never overwrites an existing .env, so local secrets are preserved.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['server', 'mobile'];

for (const pkg of targets) {
  const example = join(root, pkg, '.env.example');
  const env = join(root, pkg, '.env');

  if (!existsSync(example)) {
    console.error(`Missing ${pkg}/.env.example - skipping.`);
    continue;
  }
  if (existsSync(env)) {
    console.log(`${pkg}/.env already exists - left untouched.`);
    continue;
  }

  copyFileSync(example, env);
  console.log(`Created ${pkg}/.env from .env.example`);
}

console.log('\nNext: set JWT_SECRET in server/.env, then run `npm run setup`.');
