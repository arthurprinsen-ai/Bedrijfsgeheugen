import { readFile, writeFile } from 'node:fs/promises';

const config = JSON.parse(await readFile('site/seo-baseline.json', 'utf8'));
const home = config.home;

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function cleanHead(head) {
  return head
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\b[^>]*name=["'](?:description|robots|bg-zoekwoord)["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*property=["']og:[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*name=["']twitter:(?:card|title|description|image)["'][^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

function schemaJson() {
  const base = home.canonical;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': config.schema.organizationType,
        '@id': `${base}#organization`,
        name: config.schema.organizationName,
        url: base,
        slogan: config.schema.slogan,
        description: home.description,
        areaServed: config.schema.areaServed,
        knowsAbout: config.keywordOwners.map(item => item.keyword),
      },
      {
        '@type': 'WebSite',
        '@id': `${base}#website`,
        url: base,
        name: config.schema.organizationName,
        inLanguage: config.schema.language,
        publisher: { '@id': `${base}#organization` },
      },
    ],
  }).replaceAll('<', '\\u003c');
}

function seoBlock() {
  return `<!-- BG_PERSISTENT_SEO_V1 -->
<title>${esc(home.title)}</title>
<meta name="description" content="${esc(home.description)}">
<meta name="bg-zoekwoord" content="${esc(home.primaryKeyword)}">
<link rel="canonical" href="${esc(home.canonical)}">
<meta name="robots" content="${esc(home.robots)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta property="og:site_name" content="Bedrijfsgeheugen">
<meta property="og:title" content="${esc(home.title)}">
<meta property="og:description" content="${esc(home.description)}">
<meta property="og:url" content="${esc(home.canonical)}">
<meta property="og:image" content="${esc(home.ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(home.title)}">
<meta name="twitter:description" content="${esc(home.description)}">
<meta name="twitter:image" content="${esc(home.ogImage)}">
<script type="application/ld+json" id="bg-seo-schema">${schemaJson()}</script>`;
}

export function applySeo(html) {
  const match = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!match) throw new Error('V18 HTML has no <head> block');
  const oldHead = match[0];
  const cleaned = cleanHead(oldHead);
  if (!/<\/head>/i.test(cleaned)) throw new Error('V18 head closing tag lost');
  const newHead = cleaned.replace(/<\/head>/i, `${seoBlock()}\n</head>`);
  const result = html.replace(oldHead, newHead);
  const oldBody = (html.match(/<body\b[^>]*>[\s\S]*<\/body>/i) || [''])[0];
  const newBody = (result.match(/<body\b[^>]*>[\s\S]*<\/body>/i) || [''])[0];
  if (!oldBody || oldBody !== newBody) throw new Error('SEO layer attempted to change visible V18 body');
  return result;
}

for (const path of ['index.html', 'prototype-v18-stable.html']) {
  const html = await readFile(path, 'utf8');
  await writeFile(path, applySeo(html), 'utf8');
}

console.log(`Persistent SEO applied to historical V18: ${home.primaryKeyword} -> ${home.canonical}`);
