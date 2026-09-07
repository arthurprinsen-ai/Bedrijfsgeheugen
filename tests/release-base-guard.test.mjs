import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseBase } from '../tools/release-base-guard.mjs';

test('accepts evidence only when tested base is current main', () => {
  assert.deepEqual(evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'aaa',headSha:'bbb'}), {
    ok:true, reason:'current-main-base', testedBaseSha:'aaa', currentMainSha:'aaa', headSha:'bbb'
  });
});

test('fails closed when main moved after the PR was tested', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'ccc',headSha:'bbb'});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'stale-main-base');
});

test('fails closed when immutable release evidence is incomplete', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'aaa'});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'missing-release-evidence');
});
