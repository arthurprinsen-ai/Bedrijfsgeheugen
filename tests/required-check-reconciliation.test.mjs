import test from 'node:test';import assert from 'node:assert/strict';import {reconcile} from '../tools/delivery/required-check-reconciliation.mjs';
const sha='a'.repeat(40);const exp=[{context:'test',integration_id:123}];const ok=[{name:'test',sha,app_id:123,conclusion:'success'}];
test('exact SHA and app succeeds',()=>assert.equal(reconcile(exp,ok,sha).state,'PASS'));
test('stale SHA blocks',()=>assert.deepEqual(reconcile(exp,[{...ok[0],sha:'b'.repeat(40)}],sha).missing,['test']));
test('wrong GitHub App blocks',()=>assert.deepEqual(reconcile(exp,[{...ok[0],app_id:456}],sha).wrongSource,['test']));
test('renamed check blocks',()=>assert.deepEqual(reconcile(exp,[{...ok[0],name:'test-old'}],sha).missing,['test']));
test('pending is not green',()=>assert.deepEqual(reconcile(exp,[{...ok[0],conclusion:null}],sha).incomplete,['test']));
test('missing provider evidence fails closed',()=>assert.equal(reconcile(null,ok,sha).state,'UNKNOWN'));
