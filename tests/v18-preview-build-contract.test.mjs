import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const toml = fs.readFileSync('netlify.toml', 'utf8');

test('deploy previews use the dedicated V18 test composer, never the production composer', () => {
  const section = toml.match(/\[context\.deploy-preview\][\s\S]*?(?=\n\[|$)/)?.[0] || '';
  assert.ok(section.includes('node tools/bouw-v18-test-preview.mjs'), 'deploy-preview must run the dedicated V18 test composer');
  assert.ok(!section.includes('bouw-v18-production.mjs'), 'deploy-preview must not overwrite test with the production composer');
});

test('dedicated V18 test composer reconstructs the pinned historical V18 payload and publishes it at root', () => {
  assert.ok(fs.existsSync('tools/bouw-v18-test-preview.mjs'), 'missing dedicated V18 test composer');
  const source = fs.readFileSync('tools/bouw-v18-test-preview.mjs', 'utf8');
  assert.ok(source.includes("EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b'"), 'historical V18 payload hash is not pinned');
  assert.ok(source.includes("writeFile('prototype-v18-stable.html'"), 'composer must publish prototype-v18-stable.html');
  assert.ok(source.includes("writeFile('index.html'"), 'composer must publish V18 at the preview root');
});
