import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {allPageIds} from '../portal-v2/page-registry.js';
import {runtimeEvidenceVersion,shouldReconcileRuntimePage} from '../portal-v2/live-page-reconciliation.js';

test('a changed canonical Brain runtime projection can refresh every registered native page',()=>{
  const pages=allPageIds();
  assert.ok(pages.length>=60,'native route coverage must not silently shrink');
  for(const id of pages)assert.equal(shouldReconcileRuntimePage({open:true,authenticated:true,versionChanged:true,status:'saved'}),true,id);
  assert.notEqual(runtimeEvidenceVersion({brain:{items:[{id:'old'}]}}),runtimeEvidenceVersion({brain:{items:[{id:'new'}]}}));
  assert.notEqual(runtimeEvidenceVersion({actions:{items:[]}}),runtimeEvidenceVersion({actions:{items:[{id:'new'}]}}));
  assert.equal(runtimeEvidenceVersion(null),'null');
});

test('fail closed on cross-tenant/anonymous context, dirty writes and focused editing',()=>{
  for(const override of [{open:false},{authenticated:false},{versionChanged:false},{status:'dirty'},{status:'saving'},{status:'error'},{editing:true}])
    assert.equal(shouldReconcileRuntimePage({open:true,authenticated:true,versionChanged:true,status:'idle',editing:false,...override}),false,JSON.stringify(override));
});

test('the existing mounted shell binds original runtime events and wipes tenant DOM on auth boundary',async()=>{
  const source=await readFile(new URL('../portal-v2/page-shell.js',import.meta.url),'utf8');
  for(const event of ['bg:portal-owner-runtime-updated','bg:runtime-evidence','bg:portal-identity-boundary'])
    assert.match(source,new RegExp('['+"'"+']'+event+'['+"'"+']'),event);
  assert.match(source,/queuedRuntimePage===page/);
  assert.match(source,/root\.dataset\.pageId===page&&eligible\(\)/);
  assert.match(source,/renderedRuntimeVersion=currentRuntimeVersion\(\)/);
  assert.match(source,/root\.querySelector\('#pvNative'\)\?\.replaceChildren\(\)/);
  assert.match(source,/node\.remove\(\)/);
  assert.match(source,/focusedPageEditor\(root\)/);
  assert.match(source,/closePortalPage\(\)/);
});
