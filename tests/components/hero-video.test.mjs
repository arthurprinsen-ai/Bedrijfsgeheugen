import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/hero-video/hero-video.html', 'utf8');
const css = await readFile('components/hero-video/hero-video.css', 'utf8');
const js = await readFile('components/hero-video/hero-video.js', 'utf8');
const contract = JSON.parse(await readFile('components/hero-video/contract.json', 'utf8'));
const media = JSON.parse(await readFile('components/hero-video/media.json', 'utf8'));

test('hero video has one isolated canonical slot controlled by local media manifest', () => {
  assert.match(html, /data-bg-component="hero-video"/);
  assert.equal((html.match(/<video\b/g) || []).length, 1);
  assert.equal(contract.id, 'hero-video');
  assert.equal(contract.root, '[data-bg-component="hero-video"]');
  assert.equal(typeof media.enabled, 'boolean');
  assert.equal(media.enabled, false, 'baseline must remain video-disabled until separately accepted');
});

test('hero video owns a poster fallback and fixed aspect ratio', () => {
  assert.ok(media.poster, 'poster fallback missing');
  assert.match(html, /poster="/);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(js, /poster/);
});

test('hero video cannot reach sibling components', () => {
  for (const forbidden of ['bgkop','hero-demo','social-proof','pricing','footer']) {
    assert.ok(!html.includes(forbidden), `html reaches ${forbidden}`);
    assert.ok(!css.includes(forbidden), `css reaches ${forbidden}`);
    assert.ok(!js.includes(forbidden), `js reaches ${forbidden}`);
  }
  assert.doesNotMatch(js, /document\.querySelector\([^)]*data-bg-component[^)]*(header|hero-demo|social-proof|pricing|footer)/);
});

test('media swap interface is local and explicit', () => {
  assert.ok(contract.ownedFiles.includes('components/hero-video/media.json'));
  assert.ok(contract.invariants.includes('baseline-disabled-until-media-accepted'));
  assert.ok(contract.invariants.includes('poster-fallback'));
});
