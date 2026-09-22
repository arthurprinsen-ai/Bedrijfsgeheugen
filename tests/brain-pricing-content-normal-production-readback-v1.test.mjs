import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLiveSite } from '../tools/site-shell/live-contract.mjs';

const shell = (body, sha) => `<!doctype html><html><body><meta data-bg-release-sha="${sha}">${body}</body></html>`;

test('live pricing contract rejects legacy commercial copy', () => {
  const source = shell('<div class="bgx-vraagbalk"></div><div class="bgx-rekenaar"></div><div class="bgx-rol"></div><h3>Transform</h3><p>Per jaar</p><p>2 maanden gratis</p>', 'x');
  assert.throws(() => verifyLiveSite({home:source,pricing:source,content:source,expectedCommit:'x'}));
});
