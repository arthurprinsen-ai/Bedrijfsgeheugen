import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('homepage final build pipeline preserves scroll story wiring', () => {
  const pipeline = readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(pipeline, /bouw-v18-homepage-scroll-story\.mjs/);

  const source = readFileSync('tools/bouw-v18-homepage-scroll-story.mjs', 'utf8');
  assert.match(source, /data-bg-story-root/);
  assert.match(source, /data-bg-story-stage/);
  assert.match(source, /data-bg-story-overlay/);
  assert.match(source, /window\.scrollTo/);
  assert.match(source, /Analyseer impact/);
  assert.match(source, /Sinds deze pagina opende|Reken het na/);
});
