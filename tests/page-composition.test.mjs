import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeSite } from '../tools/compose-site.mjs';

test('same manifest inputs produce byte-identical homepage output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-compose-'));
  const manifest = join(dir, 'page.json');
  const a = join(dir, 'a.html');
  const b = join(dir, 'b.html');
  await writeFile(manifest, JSON.stringify({ components: [] }));
  await composeSite({ pageManifest: manifest, outputPath: a });
  await composeSite({ pageManifest: manifest, outputPath: b });
  assert.equal(await readFile(a, 'utf8'), await readFile(b, 'utf8'));
});

test('home manifest declares every independently owned homepage component', async () => {
  const manifest = JSON.parse(await readFile('pages/home.page.json', 'utf8'));
  assert.deepEqual(manifest.components, ['header','hero-copy','hero-video','hero-demo','social-proof','pricing','footer']);
});
