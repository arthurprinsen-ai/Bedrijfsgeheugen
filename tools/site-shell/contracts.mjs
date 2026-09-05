import { createHash } from 'node:crypto';

export const GLOBAL_COMPONENTS = ['trustbar', 'header', 'mobile-menu', 'footer'];
export const PUBLIC_PAGE_EXCLUDES = new Set([
  'index-oud.html', 'prototype-v18-stable.html', 'klantportaal.html',
  'klantportaal-demo.html', 'klant-login.html'
]);

function addMarkerToOpeningTag(tag, name) {
  if (/\bdata-bg-component=/.test(tag)) return tag;
  return tag.replace(/>$/, ` data-bg-component="${name}">`);
}

export function markCanonicalComponents(input) {
  let html = String(input);
  html = html.replace(/<div\b([^>]*\bclass="[^"]*\bbg-uniform-trust\b[^"]*"[^>]*)>/i,
    (m, attrs) => addMarkerToOpeningTag(`<div${attrs}>`, 'trustbar'));
  html = html.replace(/<header\b([^>]*\bclass="[^"]*\bv17-header\b[^"]*"[^>]*)>/i,
    (m, attrs) => addMarkerToOpeningTag(`<header${attrs}>`, 'header'));
  html = html.replace(/<aside\b([^>]*\bclass="[^"]*\bv18-mobile-drawer\b[^"]*"[^>]*)>/i,
    (m, attrs) => addMarkerToOpeningTag(`<aside${attrs}>`, 'mobile-menu'));
  html = html.replace(/<footer\b([^>]*)>/i,
    (m, attrs) => addMarkerToOpeningTag(`<footer${attrs}>`, 'footer'));
  return html;
}

function markedOpeningTags(html, name) {
  const re = new RegExp(`<([a-z0-9-]+)\\b[^>]*data-bg-component="${name}"[^>]*>`, 'gi');
  return [...String(html).matchAll(re)];
}

function extractMarkedElement(html, name) {
  const matches = markedOpeningTags(html, name);
  if (matches.length !== 1) throw new Error(`${name}: expected exactly one canonical component, found ${matches.length}`);
  const open = matches[0];
  const tag = open[1].toLowerCase();
  const start = open.index;
  const scan = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}\\s*>`, 'gi');
  scan.lastIndex = start;
  let depth = 0;
  let token;
  while ((token = scan.exec(html))) {
    if (token[0].startsWith(`</`)) depth--;
    else depth++;
    if (depth === 0) return html.slice(start, scan.lastIndex);
  }
  throw new Error(`${name}: canonical component is not closed`);
}

function hasRenderedClass(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<[a-z0-9-]+\\b[^>]*class="[^"]*\\b${escaped}\\b[^"]*"[^>]*>`, 'i').test(String(html));
}

export function componentHash(html, name) {
  return createHash('sha256').update(extractMarkedElement(String(html), name)).digest('hex');
}

export function verifyPageShell(input, path = '') {
  const html = String(input);
  for (const name of GLOBAL_COMPONENTS) {
    const count = markedOpeningTags(html, name).length;
    if (count !== 1) throw new Error(`${path}: ${name} canonical component count is ${count}`);
  }

  const header = extractMarkedElement(html, 'header');
  if (!/\bclass="[^"]*\bv17-header\b/.test(header)) throw new Error(`${path}: header is not the canonical v17-header`);

  if (path === 'prijzen.html') {
    if (/\bclass="[^"]*\bbgkop\b/.test(html) || /id="bgkopMob"/.test(html)) {
      throw new Error(`${path}: legacy pricing header/menu shell detected`);
    }
    for (const cls of ['bgx-vraagbalk', 'bgx-rekenaar', 'bgx-rol']) {
      if (!hasRenderedClass(html, cls)) throw new Error(`${path}: pricing page-tools missing ${cls}`);
    }
  } else {
    const pricingRendered = ['bgx-vraagbalk', 'bgx-rekenaar', 'bgx-rol'].some(cls => hasRenderedClass(html, cls));
    if (/data-bg-component="page-tools"/.test(html) || pricingRendered) {
      throw new Error(`${path}: pricing page-tools are only allowed on prijzen.html`);
    }
  }
  return true;
}

export function verifyGlobalComponentHashes(pages) {
  const baseline = new Map();
  for (const { path, html } of pages) {
    verifyPageShell(html, path);
    for (const name of GLOBAL_COMPONENTS) {
      const hash = componentHash(html, name);
      if (!baseline.has(name)) baseline.set(name, { hash, path });
      else if (baseline.get(name).hash !== hash) {
        throw new Error(`${path}: ${name} differs from canonical ${baseline.get(name).path}`);
      }
    }
  }
  return Object.fromEntries([...baseline].map(([name, value]) => [name, value.hash]));
}
