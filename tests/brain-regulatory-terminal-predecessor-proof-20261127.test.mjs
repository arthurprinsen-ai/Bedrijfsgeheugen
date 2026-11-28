import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOpenRegulatoryPredecessor} from '../tools/delivery/terminal-migration-identity.mjs';
const obligation='regulatory-source-watch-45996045356',head='a'.repeat(40),blob='b'.repeat(40),merge='c'.repeat(40);
const body=['Obligation-ID: '+obligation,'Regulatory-Candidate-Type: source-observation','Writer-Lease-State: TERMINAL_DELIVERY','Writer-Lease-Head: '+head,'Writer-Lease-Obligation: '+obligation,'Writer-Lease-NonOwner-Action: DEFER'].join('\n');
const predecessor={number:6201,state:'open',merged:false,head:{sha:head},changed_files:1,body};
const successor={number:6213,state:'closed',merged:true,merge_commit_sha:merge,body:'Obligation-ID: '+obligation+'\nSupersedes: 6201'};
const files=[{filename:'data/regulatory-source-state.json',status:'modified',sha:blob}];
const input={predecessor,successor,files,originalBlob:blob,successorBlob:blob,currentBlob:blob,obligation,headRecheck:head};
test('exact single non-migration source adoption resolves circular dependency without releasing original lease',()=>{
 const proof=verifyOpenRegulatoryPredecessor(input);
 assert.equal(proof.status,'OPEN_REGULATORY_NON_MIGRATION_PROVEN');
 assert.equal(proof.writer_lease_released,false);
});
test('unknown, extra, migration, stale, mismatched lineage or changed head remains blocked',()=>{
 for(const change of [
  {files:[]},{files:[...files,{filename:'supabase/migrations/20261127120000_extra.sql'}]},
  {files:[{...files[0],filename:'supabase/migrations/20261127120000_extra.sql'}]},
  {files:[{...files[0],status:'removed'}]},{currentBlob:'d'.repeat(40)},
  {successorBlob:'d'.repeat(40)},{headRecheck:'d'.repeat(40)},
  {predecessor:{...predecessor,changed_files:2}},
  {predecessor:{...predecessor,body:body+'\nWriter-Lease-State: RELEASED'}},
  {successor:{...successor,merged:false}},
  {successor:{...successor,body:'Obligation-ID: '+obligation+'\nSupersedes: 6202'}},
  {obligation:'different-obligation'}
 ])assert.throws(()=>verifyOpenRegulatoryPredecessor({...input,...change}),/OPEN_REGULATORY_PREDECESSOR_UNPROVEN/);
});
test('terminal workflow retains strict migration predecessor guard and live readback',()=>{
 const w=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
 assert.match(w,/SUPERSEDES_PR_NOT_TERMINAL/);
 assert.match(w,/verifyRetiredMigrationSupersession/);
 assert.match(w,/verifyOpenRegulatoryPredecessor/);
 assert.match(w,/live\.body!==pr\.body/);
 assert.ok(w.indexOf('OPEN_REGULATORY_PREDECESSOR_PROOF')<w.indexOf('Persist canonical Brain terminal evidence before terminal claim'));
});
