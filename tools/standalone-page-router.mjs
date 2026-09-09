import { readFile, writeFile, glob } from 'node:fs/promises';

const EXCLUDES = new Set(['index.html', 'prototype-v18-stable.html']);
const VISIBILITY_GUARD = `<style id="bg-standalone-visibility-guard">
html,body{opacity:1!important;visibility:visible!important}
body{display:block!important}
body>header,body>main,body>footer,.bgtop,.bgkop,.bgvoet,.bg-standalone-page{opacity:1!important;visibility:visible!important}
body>header,body>main,body>footer,.bg-standalone-page{display:block!important;transform:none!important}
.bg-standalone-page>*{visibility:visible!important}
/* Legacy standalone CSS is scoped below .inhoud-body. Root-only desktop rules such
   as html{overflow-y:scroll;scrollbar-gutter:stable} must never become a nested
   scroll container there: Chrome/macOS can otherwise leave the content paint
   blank until a resize/DevTools forces a new layout. Platform does not use this
   legacy standalone scoping path and is therefore the control condition. */
.bg-standalone-page .inhoud-body{overflow-y:visible!important;scrollbar-gutter:auto!important}
</style>`;

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

export function ontkoppelStandalonePageState(input) {
  return String(input || '')
    .replace(/<div\s+class="page\s+active"\s+id="view-inhoud">/gi,
      '<div class="bg-standalone-page" id="view-inhoud">')
    .replace(/<div\s+id="view-inhoud"\s+class="page\s+active">/gi,
      '<div class="bg-standalone-page" id="view-inhoud">');
}

export function borgStandaloneVisibility(input) {
  const html = String(input || '');
  if (html.includes('id="bg-standalone-visibility-guard"')) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${VISIBILITY_GUARD}\n</head>`);
  return `${VISIBILITY_GUARD}\n${html}`;
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
    const next = borgStandaloneVisibility(
      ontkoppelStandalonePageState(verwijderHomepageSpaRouter(html))
    );
    if (next !== html) {
      await writeFile(file, next, 'utf8');
      changed += 1;
    }
  }
  console.log(`Standalone page isolation + state decoupling + visibility guard applied to ${changed} page(s)`);
  return changed;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await isolateStandalonePages();
}
