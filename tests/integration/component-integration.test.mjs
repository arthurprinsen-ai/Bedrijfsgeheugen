import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeHomeMigration } from '../../tools/compose-home-migration.mjs';

const ids = ['header','hero-copy','hero-video','hero-demo','social-proof','pricing','footer'];

test('migration composer preserves source index and replaces only isolated zones', async () => {
  const before = await readFile('index.html', 'utf8');
  const dir = await mkdtemp(join(tmpdir(), 'bg-home-integration-'));
  const outputPath = join(dir, 'index.html');
  await composeHomeMigration({ sourcePath: 'index.html', outputPath });
  const after = await readFile('index.html', 'utf8');
  const output = await readFile(outputPath, 'utf8');

  assert.equal(after, before, 'source index.html was mutated');
  for (const id of ids) {
    const roots = output.match(new RegExp(`<[^>]+data-bg-component=["']${id}["'][^>]*>`, 'g')) || [];
    assert.equal(roots.length, 1, `${id} must render exactly once`);
  }
  assert.match(output, /Onderzoek bewijst: kennisverlies/);
  assert.match(output, /Veelgestelde vragen/);
  assert.match(output, /Bedrijfsprocessen automatiseren/);
  assert.match(output, /Cookiebanner \(AVG\/GDPR\)/);
});

test('hero video is injected inside hero demo exactly once', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-home-video-'));
  const outputPath = join(dir, 'index.html');
  await composeHomeMigration({ sourcePath: 'index.html', outputPath });
  const output = await readFile(outputPath, 'utf8');
  const demoStart = output.indexOf('<section data-bg-component="hero-demo"');
  const videoStart = output.indexOf('<section data-bg-component="hero-video"');
  assert.ok(demoStart >= 0 && videoStart > demoStart, 'hero video must be nested after hero demo root begins');
  assert.equal((output.match(/openart-hero-iphone-safe-v1\.mp4/g) || []).length, 1, 'baseline hero media must occur once');
  assert.doesNotMatch(output, /data-bg-slot="hero-video"/);
  assert.doesNotMatch(output, /class="hero-product-video"/);
});

test('component CSS neutralizes legacy global section spacing where required', async () => {
  const heroCopy = await readFile('components/hero-copy/hero-copy.css', 'utf8');
  const heroVideo = await readFile('components/hero-video/hero-video.css', 'utf8');
  assert.match(heroCopy, /\[data-bg-component="hero-copy"\][^{]*\{[^}]*padding:\s*0/);
  assert.match(heroVideo, /\[data-bg-component="hero-video"\][^{]*\{[^}]*padding:\s*0/);
});

test('composed preview loads component CSS and behavior without changing legacy assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-home-assets-'));
  const outputPath = join(dir, 'index.html');
  await composeHomeMigration({ sourcePath: 'index.html', outputPath });
  const output = await readFile(outputPath, 'utf8');
  for (const id of ids) assert.match(output, new RegExp(`data-bg-component-styles="${id}"`));
  assert.match(output, /data-bg-component-script="header"/);
  assert.match(output, /data-bg-component-script="hero-video"/);
  assert.match(output, /assets\/kop\.css/);
});
