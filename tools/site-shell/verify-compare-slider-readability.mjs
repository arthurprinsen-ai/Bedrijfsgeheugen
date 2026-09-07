import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { validateCompareSliderSource } from './compare-slider-readability.mjs';

const root = process.cwd();
const ignored = new Set(['.git','node_modules','.netlify','dist','build','coverage']);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.html?$/i.test(entry.name)) files.push(full);
  }
}

walk(root);
const errors = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  errors.push(...validateCompareSliderSource(source, { path: relative }));
}

if (errors.length) {
  for (const error of errors) console.error(`${error.code}: ${error.path}: ${error.message}`);
  process.exit(1);
}

console.log(`Compare-slider readability contract: GREEN (${files.length} HTML-bestanden gecontroleerd).`);
