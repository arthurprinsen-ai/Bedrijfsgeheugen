import { readFile, writeFile, glob } from 'node:fs/promises';

const EXCLUDES = new Set(['index.html', 'prototype-v18-stable.html']);

function isHomepageSpaRouter(script) {
  const s = String(script || '');
  return /\bshowView\s*\(/.test(s)
    && (/\bviewButtons\b/.test(s) || /data-view/.test(s))
    && (/\.page/.test(s) || /view-/.test(s));
}

export function verwijderHomepageSpaRouter(input) {
  return String(input || '').replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs, body) => {
    if (/\bsrc\s*=/.test(attrs || '') || !isHomepageSpaRouter(body)) return whole;
    return '<!-- standalone-page: inherited homepage SPA router removed -->';
  });
}

export async function isolateStandalonePages() {
  const files = [];
  for await (const p of glob('*.html')) if (!EXCLUDES.has(p)) files.push(p);
  for await (const p of glob('blog/*/index.html')) files.push(p);
  files.push('blog/index.html');

  let changed = 0;
  for (const file of [...new Set(files)]) {
    let html;
    try { html = await readFile(file, 'utf8'); } catch { continue; }
    if (!html.includes('<body')) continue;
    const next = verwijderHomepageSpaRouter(html);
    if (next !== html) {
      await writeFile(file, next, 'utf8');
      changed += 1;
    }
  }
  console.log(`Standalone page router isolation applied to ${changed} page(s)`);
  return changed;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await isolateStandalonePages();
}
