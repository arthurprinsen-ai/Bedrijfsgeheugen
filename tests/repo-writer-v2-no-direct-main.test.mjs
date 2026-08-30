import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('approved central blog writer is candidate-only under BRAIN v2', async () => {
  const workflow = await readFile('.github/workflows/approved-central-blog.yml', 'utf8');
  assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/);
  assert.doesNotMatch(workflow, /default:\s*direct\b/);
  assert.match(workflow, /default:\s*candidate-pr\b/);
  assert.match(workflow, /production_authority=BG169/);
  assert.match(workflow, /direct_main_push=false/);
});

test('repository workflows do not contain an explicit HEAD:main push bypass', async () => {
  const files = (await readdir('.github/workflows')).filter(name => /\.ya?ml$/i.test(name));
  const offenders = [];
  for (const file of files) {
    const text = await readFile(`.github/workflows/${file}`, 'utf8');
    if (/git\s+push\s+origin\s+HEAD:main/.test(text)) offenders.push(file);
  }
  assert.deepEqual(offenders, [], `direct main push bypass found: ${offenders.join(', ')}`);
});
