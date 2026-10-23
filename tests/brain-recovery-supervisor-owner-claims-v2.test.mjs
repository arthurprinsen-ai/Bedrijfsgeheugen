import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSupervisorOwnerClaims} from '../tools/delivery/recovery-supervisor-owner-claims.mjs';
const sha='a'.repeat(40);
const pr=(number,scope,{draft=false,lease='TERMINAL_DELIVERY',head=sha}={})=>({
  number,state:'open',draft,head:{sha:head},title:'example',
  body:['Writer-Lease-State: '+lease,'Writer-Lease-Owner: test-owner-'+number,
    'Writer-Lease-Head: '+sha,'Change-Scope: '+scope].join('\n')
});
test('two active different PRs claiming one exact file are detected and cannot authorize writes',()=>{
  const result=assessSupervisorOwnerClaims([
    pr(4795,'.github/workflows/powerhouse-repository-janitor.yml, tools/a.mjs'),
    pr(4797,'.github/workflows/powerhouse-repository-janitor.yml, tools/b.mjs')
  ]);
  assert.equal(result.status,'DECLARED_MULTI_WRITER_COLLISION');
  assert.equal(result.collisions.length,1);
  assert.deepEqual(result.collisions[0].writers.map(x=>x.pr_number),[4795,4797]);
  assert.equal(result.write_authorized,false);
  assert.equal(result.global_single_writer_proven,false);
});
test('drafts and retired PRs cannot claim active writer ownership',()=>{
  const retired=pr(4792,'.github/workflows/powerhouse-repository-janitor.yml');
  retired.title='RETIRED — duplicate';
  const result=assessSupervisorOwnerClaims([
    pr(4795,'.github/workflows/powerhouse-repository-janitor.yml',{draft:true}),
    retired,pr(4793,'.github/workflows/powerhouse-repository-janitor.yml')
  ]);
  assert.equal(result.collisions.length,0);
  assert.equal(result.writers.length,1);
});
test('stale lease head or missing declared scope cannot be accepted as a healthy lock',()=>{
  const invalid=pr(4795,'tools/a.mjs',{head:'b'.repeat(40)});
  const unknown=pr(4797,'');
  const result=assessSupervisorOwnerClaims([invalid,unknown]);
  assert.equal(result.status,'PARTIAL_OWNER_DECLARATIONS');
  assert.deepEqual(result.invalid_lease_prs,[4795]);
  assert.deepEqual(result.unverified_scope_prs,[4797]);
  assert.equal(result.write_authorized,false);
});
test('no provider snapshot is unknown, never a green single-writer assertion',()=>{
  const result=assessSupervisorOwnerClaims(null);
  assert.equal(result.status,'PROVIDER_SNAPSHOT_MISSING');
  assert.equal(result.collisions,null);
  assert.equal(result.write_authorized,false);
});
