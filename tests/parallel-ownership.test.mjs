import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = ['header','hero-copy','hero-video','hero-demo','social-proof','pricing','footer'];

test('all website components have explicit writable ownership', async () => {
  const ownership = JSON.parse(await readFile('config/component-ownership.json', 'utf8'));
  for (const id of required) {
    assert.ok(Array.isArray(ownership[id]), `${id} ownership missing`);
    assert.ok(ownership[id].length > 0, `${id} ownership empty`);
  }
});

test('component ownership scopes do not overlap exactly', async () => {
  const ownership = JSON.parse(await readFile('config/component-ownership.json', 'utf8'));
  const pairs = [];
  const entries = Object.entries(ownership);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [a, aPaths] = entries[i];
      const [b, bPaths] = entries[j];
      for (const ap of aPaths) for (const bp of bPaths) {
        if (ap === bp) pairs.push(`${a}:${b}:${ap}`);
      }
    }
  }
  assert.deepEqual(pairs, []);
});
