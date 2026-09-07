import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseBase } from '../tools/release-base-guard.mjs';

test('accepts evidence when tested base is current main', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'aaa',headSha:'bbb',prLanes:['website'],mainChangedLanes:[]});
  assert.equal(result.ok,true);
  assert.equal(result.reason,'current-main-base');
});

test('accepts moved main when changed delivery lanes are disjoint', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'ccc',headSha:'bbb',prLanes:['website'],mainChangedLanes:['backend']});
  assert.equal(result.ok,true);
  assert.equal(result.reason,'main-moved-disjoint-lanes');
});

test('fails closed when main moved in an overlapping delivery lane', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'ccc',headSha:'bbb',prLanes:['website'],mainChangedLanes:['website','backend']});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'stale-main-overlapping-lane');
  assert.deepEqual(result.overlappingLanes,['website']);
});

test('fails closed when immutable release evidence is incomplete', () => {
  const result=evaluateReleaseBase({testedBaseSha:'aaa',currentMainSha:'aaa',prLanes:['website']});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'missing-release-evidence');
});
