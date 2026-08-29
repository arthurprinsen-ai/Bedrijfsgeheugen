import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredClasses = ['hero-video-media','header-navigation','component-interface-change'];

test('required change classes are explicit and non-empty', async () => {
  const classes = JSON.parse(await readFile('config/change-classes.json', 'utf8'));
  for (const id of requiredClasses) {
    assert.ok(classes[id], `${id} missing`);
    assert.ok(Array.isArray(classes[id].components), `${id}.components missing`);
    assert.ok(Array.isArray(classes[id].allowed), `${id}.allowed missing`);
    assert.ok(classes[id].allowed.length > 0, `${id}.allowed empty`);
  }
});

test('hero-video-media cannot write header or unrelated components', async () => {
  const classes = JSON.parse(await readFile('config/change-classes.json', 'utf8'));
  const allowed = classes['hero-video-media'].allowed.join('\n');
  assert.equal(/components\/header/.test(allowed), false);
  assert.equal(/components\/hero-copy/.test(allowed), false);
  assert.equal(/components\/hero-demo/.test(allowed), false);
  assert.deepEqual(classes['hero-video-media'].components, ['hero-video']);
});
