import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeSite } from '../tools/compose-site.mjs';

test('page composer emits component jsEntry paths exactly once', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-page-js-entry-'));
  const outputPath = join(dir, 'index.html');
  await composeSite({ pageManifest: 'pages/home.page.json', outputPath });
  const html = await readFile(outputPath, 'utf8');

  assert.match(html, /src="\/components\/header\/header\.js"/);
  assert.doesNotMatch(html, /\/components\/header\/components\/header\/header\.js/);
});
