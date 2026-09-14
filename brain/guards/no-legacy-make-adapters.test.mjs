import test from 'node:test';
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';

async function exists(path){
  try { await access(path); return true; } catch { return false; }
}

test('legacy Make runtime adapters are absent from the canonical Brain', async () => {
  assert.equal(await exists('brain/adapters/knowledge-make.mjs'), false, 'knowledge-make adapter must not exist');
  assert.equal(await exists('brain/adapters/make-contract-map.json'), false, 'Make contract map must not exist');
});

test('Brain adapter source cannot reintroduce Make as a runtime source', async () => {
  const directory = await import('node:fs/promises').then(fs => fs.readdir('brain/adapters'));
  const sourceFiles = directory.filter(name => name.endsWith('.mjs'));
  for (const name of sourceFiles) {
    const source = await readFile(`brain/adapters/${name}`, 'utf8');
    assert.doesNotMatch(source, /source_type\s*:\s*['"]make['"]/i, `${name} reintroduces Make source_type`);
    assert.doesNotMatch(source, /system\s*:\s*['"]make['"]/i, `${name} reintroduces Make source lineage`);
  }
});
