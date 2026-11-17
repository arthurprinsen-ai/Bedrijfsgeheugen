import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileLivePrScope} from '../tools/delivery/live-pr-scope-reconciliation.mjs';

const old='a'.repeat(40),current='b'.repeat(40),head='c'.repeat(40);
const live={
 number:5934,state:'open',
 base:{ref:'main',sha:current},
 head:{ref:'fix/5232-original-blog-branch-backlog-20261117-v1',sha:head}
};
const args={eventName:'pull_request',prNumber:5934,eventBaseSha:old,eventHeadSha:head,livePr:live};

test('immutable old PR event cannot miscount unrelated current-main commits',()=>{
 const result=reconcileLivePrScope(args);
 assert.equal(result.baseSha,current);
 assert.equal(result.headSha,head);
 assert.equal(result.baseDrift,true);
 assert.equal(result.proof,'GITHUB_LIVE_OPEN_PR_SAME_HEAD_BASE_MAIN');
});
test('same latest base is idempotently accepted, not forged as drift',()=>{
 const result=reconcileLivePrScope({...args,eventBaseSha:current});
 assert.equal(result.baseDrift,false);
});
test('live PR must be SAME original open exact head, same number and main base',()=>{
 const invalid=[
  {...args,livePr:null},
  {...args,livePr:{...live,number:6000}},
  {...args,livePr:{...live,state:'closed'}},
  {...args,livePr:{...live,base:{ref:'not-main',sha:current}}},
  {...args,livePr:{...live,base:{ref:'main',sha:'bad'}}},
  {...args,livePr:{...live,head:{...live.head,sha:'bad'}}},
  {...args,eventHeadSha:old},
  {...args,eventBaseSha:'broken'},
  {...args,eventName:'merge_group'}
 ];
 for(const x of invalid)assert.throws(()=>reconcileLivePrScope(x),/REQUIRED_LIVE_PR_/);
});
test('protected Required still computes provider-attested merge base and enforces original budget',()=>{
 const yml=readFileSync(new URL('../.github/workflows/required-test.yml',import.meta.url),'utf8');
 assert.ok(yml.includes('reconcileLivePrScope'));
 assert.ok(yml.includes('const providerBaseSha=livePrScope?.baseSha || comparisonBaseSha'));
 assert.ok(yml.includes('resolvePRScopeMergeBase'));
 assert.ok(yml.includes('if(!hygiene.ok) throw new Error'));
 assert.ok(yml.includes('const diffBaseSha=scopeBase.sha'));
 assert.ok(!yml.includes('const providerBaseSha=context.prNumber && context.baseSha ? context.baseSha : comparisonBaseSha'));
});
