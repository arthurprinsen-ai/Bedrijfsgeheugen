import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {finiteEvidence,sumKnownEvidence,maxKnownEvidence,entrepreneurSnapshotFreshness} from '../supabase/functions/portal-state-eu/entrepreneur-snapshot-truth.js';

const now=Date.parse('2026-10-20T09:00:00.000Z');
const signal=(observed_at='2026-10-20T08:25:00.000Z')=>({observed_at,signal_key:'signal-a'});
const base=(refreshed_at='2026-10-20T08:30:00.000Z',status='CURRENT')=>({refreshed_at,status});

test('missing, blank and boolean financial evidence never becomes a fake zero',()=>{
 assert.equal(finiteEvidence(null),null);
 assert.equal(finiteEvidence(undefined),null);
 assert.equal(finiteEvidence(''),null);
 assert.equal(finiteEvidence('  '),null);
 assert.equal(finiteEvidence(false),null);
 assert.equal(finiteEvidence('not a value'),null);
 assert.equal(sumKnownEvidence([null,undefined,'',false]),null);
 assert.equal(maxKnownEvidence([null,'',false]),null);
});

test('genuine measured numeric zero remains zero while unknown is excluded from aggregates',()=>{
 assert.equal(finiteEvidence(0),0);
 assert.equal(finiteEvidence('0'),0);
 assert.equal(sumKnownEvidence([null,0,'2.5','']),2.5);
 assert.equal(sumKnownEvidence([null,0]),0);
 assert.equal(maxKnownEvidence([null,0,-2]),0);
});

test('a recent canonical snapshot and actual observed signal are required for CURRENT',()=>{
 const result=entrepreneurSnapshotFreshness({base:base(),signals:[signal()],now});
 assert.equal(result.status,'CURRENT');
 assert.equal(result.refreshed_at,base().refreshed_at);
 assert.equal(result.age_minutes,30);
 assert.equal(result.customer_value_evidence_inferred,false);
});

test('an old canonical snapshot is STALE despite new observation and old CURRENT metadata',()=>{
 const result=entrepreneurSnapshotFreshness({base:base('2026-10-20T06:55:00.000Z'),signals:[signal()],now});
 assert.equal(result.status,'STALE');
 assert.equal(result.age_minutes,125);
 assert.equal(result.refreshed_at,'2026-10-20T06:55:00.000Z');
});

test('an absent canonical source snapshot cannot be forged by a request timestamp',()=>{
 const result=entrepreneurSnapshotFreshness({base:null,signals:[signal()],now});
 assert.equal(result.status,'STALE');
 assert.equal(result.refreshed_at,null);
 assert.equal(result.valid_source_snapshot,false);
});

test('old observed signals and canonical partial state never become CURRENT',()=>{
 assert.equal(entrepreneurSnapshotFreshness({base:base(),signals:[signal('2026-09-30T08:30:00Z')],now}).status,'PARTIAL');
 assert.equal(entrepreneurSnapshotFreshness({base:base(undefined,'PARTIAL'),signals:[signal()],now}).status,'PARTIAL');
 assert.equal(entrepreneurSnapshotFreshness({base:base(),signals:[],now}).status,'EMPTY');
});

test('invalid future source clock cannot mark a projection current',()=>{
 const result=entrepreneurSnapshotFreshness({base:base('2026-10-20T10:00:00.000Z'),signals:[signal()],now});
 assert.equal(result.status,'STALE');
 assert.equal(result.refreshed_at,null);
});

test('existing authenticated tenant-overlay Edge route imports strict truth helpers',()=>{
 const source=fs.readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
 assert.match(source,/entrepreneurSnapshotFreshness\(\{base,signals,now\}\)/);
 assert.match(source,/status:sourceTruth\.status/);
 assert.match(source,/refreshed_at:sourceTruth\.refreshed_at/);
 assert.match(source,/sumKnownEvidence/);
 assert.match(source,/\.eq\('tenant_id',tenantId\)/);
 assert.doesNotMatch(source,/status:signals\.length\?'CURRENT':'EMPTY'/);
 assert.doesNotMatch(source,/refreshed_at:base\?\.refreshed_at\|\|new Date\(\)\.toISOString\(\)/);
});
