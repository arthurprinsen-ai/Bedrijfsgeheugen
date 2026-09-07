import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseBase } from '../tools/release-base-guard.mjs';

test('accepts evidence when tested base is current main', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'aaa',headSha:'bbb'});
  assert.equal(result.ok,true);
  assert.equal(result.reason,'current-main-base');
});

test('accepts moved main when branch drift is proven non-overlapping', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'ccc',headSha:'bbb',driftAction:'KEEP_TESTED_FEATURE'});
  assert.equal(result.ok,true);
  assert.equal(result.reason,'main-moved-non-overlapping');
});

test('fails closed when branch drift requires synchronization', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'ccc',headSha:'bbb',driftAction:'SYNC_REQUIRED'});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'stale-main-relevant-drift');
});

test('fails closed when moved-main drift decision is missing', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'ccc',headSha:'bbb'});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'stale-main-relevant-drift');
});

test('fails closed when immutable release evidence is incomplete', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'aaa'});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'missing-release-evidence');
});
