import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  ensureBlogContentIds,
  ensureBodyContentId,
  verifyBodyContentId,
} from '../tools/site-shell/ensure-blog-content-id.mjs';

test('ensureBodyContentId adds the canonical marker without losing existing body attributes', () => {
  const html = '<html><body class="site" data-theme="light"><main>Artikel</main></body></html>';
  const result = ensureBodyContentId(html, 'blog:voorbeeld');
  assert.match(result, /<body class="site" data-theme="light" data-content-id="blog:voorbeeld">/);
  assert.equal(verifyBodyContentId(result, 'blog:voorbeeld'), true);
});

test('ensureBodyContentId repairs a stale marker deterministically', () => {
  const html = '<html><body data-content-id="blog:oud" class="site"></body></html>';
  const result = ensureBodyContentId(html, 'blog:nieuw');
  assert.match(result, /data-content-id="blog:nieuw"/);
  assert.doesNotMatch(result, /blog:oud/);
});

test('final blog artifact gets content id derived from its canonical slug', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bg-blog-content-id-'));
  const dir = path.join(root, 'blog', 'ongeprijsd-probleem-bedrijfsvoering');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'index.html');
  await writeFile(file, '<!doctype html><html><body><h1>Ongeprijsd probleem</h1></body></html>', 'utf8');

  const result = await ensureBlogContentIds(root);
  const built = await readFile(file, 'utf8');
  assert.deepEqual(result, { checked: 1, changed: 1 });
  assert.equal(verifyBodyContentId(built, 'blog:ongeprijsd-probleem-bedrijfsvoering'), true);
});
