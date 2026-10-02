import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getRoutes } = require('expo-router/build/getRoutes');

const root = path.resolve('src/app');
const files = [];

(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push('./' + path.relative(root, full).replace(/\\/g, '/').replace(/\.(tsx|ts|jsx|js)$/, ''));
    }
  }
})(root);

const contextModule = (filePath) => ({
  default: () => null,
  route: null,
  contextKey: filePath,
});
contextModule.keys = () => files.map((f) => f + '.tsx');
contextModule.resolve = (key) => contextModule(key);
contextModule.platform = 'web';
contextModule.isServer = true;
contextModule.baseUrl = '/';
contextModule.serverRoot = root;

const routes = getRoutes(contextModule, { ignoreEntryPoints: true });

const rows = [];

// Group segments like "(tabs)" do not appear in the URL.
const isGroup = (segment) => /^\(.*\)$/.test(segment);

const walk = (nodes, prefix) => {
  for (const node of nodes) {
    if (node.type !== 'layout' && !node.generated) {
      // Route leaf.
      let full;
      if (node.route === 'index') full = prefix;
      else full = prefix === '' ? `/${node.route}` : `${prefix}/${node.route}`;
      rows.push([node.contextKey, full === '' ? '/' : full]);
    }

    if (node.children) {
      let next = prefix;
      if (node.type === 'layout' && node.route && !isGroup(node.route)) {
        next = prefix === '' ? `/${node.route}` : `${prefix}/${node.route}`;
      }
      walk(node.children, next);
    }
  }
};
walk(routes.children ?? [], '');

console.log('\n=== ROUTE TABLE ===');
for (const [key, p] of rows) console.log(key.padEnd(34), '->', p);

const byPath = {};
for (const [key, p] of rows) (byPath[p] ??= []).push(key);

console.log('\n=== DUPLICATE PATHS ===');
let found = false;
for (const [p, keys] of Object.entries(byPath)) {
  if (keys.length > 1) {
    found = true;
    console.log(`${p}  <=  ${keys.join('   AND   ')}`);
  }
}
if (!found) console.log('none');
