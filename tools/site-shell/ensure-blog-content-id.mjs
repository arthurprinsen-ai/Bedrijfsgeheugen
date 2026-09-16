import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function expectedBlogContentId(slug) {
  const clean = String(slug || '').trim();
  if (!clean || clean === '.' || clean === '..' || clean.includes('/') || clean.includes('\\')) {
    throw new Error(`invalid blog slug: ${slug}`);
  }
  return `blog:${clean}`;
}

export function ensureBodyContentId(html, contentId) {
  const source = String(html || '');
  const body = source.match(/<body\b([^>]*)>/i);
  if (!body) throw new Error('blog artifact has no <body>');

  const attrs = body[1] || '';
  const marker = /\sdata-content-id\s*=\s*(["'])[^"']*\1/i;
  const nextAttrs = marker.test(attrs)
    ? attrs.replace(marker, ` data-content-id="${contentId}"`)
    : `${attrs} data-content-id="${contentId}"`;
  return source.replace(body[0], `<body${nextAttrs}>`);
}

export function verifyBodyContentId(html, contentId) {
  const escaped = contentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<body\\b[^>]*\\sdata-content-id\\s*=\\s*(["'])${escaped}\\1[^>]*>`, 'i').test(String(html || ''));
}

export async function ensureBlogContentIds(root = '.') {
  const blogRoot = path.join(root, 'blog');
  const entries = await readdir(blogRoot, { withFileTypes: true });
  const result = { checked: 0, changed: 0 };

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const file = path.join(blogRoot, slug, 'index.html');
    let html;
    try {
      html = await readFile(file, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }

    const contentId = expectedBlogContentId(slug);
    result.checked += 1;
    const normalized = ensureBodyContentId(html, contentId);
    if (!verifyBodyContentId(normalized, contentId)) {
      throw new Error(`blog content identity contract failed: ${file}:${contentId}`);
    }
    if (normalized !== html) {
      await writeFile(file, normalized, 'utf8');
      result.changed += 1;
    }
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await ensureBlogContentIds(process.argv[2] || '.');
  console.log(`Blog content identity: ${result.checked} checked, ${result.changed} normalized`);
}
