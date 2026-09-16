import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function ensurePublicationMarker(html, contentId) {
  const source = String(html);
  const id = String(contentId || '').trim();
  if (!id) return source;

  const existing = source.match(/<body\b[^>]*\bdata-content-id=(['"])(.*?)\1[^>]*>/i);
  if (existing) {
    if (existing[2] !== id) {
      throw new Error(`conflicting publication marker: expected ${id}, found ${existing[2]}`);
    }
    return source;
  }

  if (!/<body\b[^>]*>/i.test(source)) throw new Error(`body missing for publication marker ${id}`);
  return source.replace(/<body\b([^>]*)>/i, `<body$1 data-content-id="${escapeAttr(id)}">`);
}

export async function applyLedgerPublicationMarkers({
  ledgerPath = 'data/content-publication-ledger.json',
  root = '.'
} = {}) {
  const ledger = JSON.parse(await readFile(join(root, ledgerPath), 'utf8'));
  const applied = [];

  for (const record of Object.values(ledger.days || {})) {
    const slug = String(record?.slug || '').trim();
    const contentId = String(record?.content_id || '').trim();
    if (!slug || !contentId) continue;

    const expected = `blog:${slug}`;
    if (contentId !== expected) {
      throw new Error(`publication identity mismatch for ${slug}: expected ${expected}, found ${contentId}`);
    }

    const file = join(root, 'blog', slug, 'index.html');
    const before = await readFile(file, 'utf8');
    const after = ensurePublicationMarker(before, contentId);
    if (after !== before) await writeFile(file, after, 'utf8');
    if (!after.includes(`data-content-id="${contentId}"`) && !after.includes(`data-content-id='${contentId}'`)) {
      throw new Error(`publication marker not materialized for ${contentId}`);
    }
    applied.push({ content_id: contentId, slug, file, changed: after !== before });
  }

  return applied;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const applied = await applyLedgerPublicationMarkers();
  console.log(JSON.stringify({ ok: true, publications: applied }, null, 2));
}
