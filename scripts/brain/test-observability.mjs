import assert from 'node:assert/strict';
import {checkTrace,checkInvariants} from '../../brain/observability/invariants.mjs';

let legacy=checkTrace([{type:'Signal',trace_id:'t'},{type:'Mission',trace_id:'t'}]);
assert(legacy.violations.includes('MISSING_OUTCOME'));
legacy=checkInvariants({current_state_age_hours:30,max_state_age_hours:24});
assert(legacy.violations.includes('STALE_CURRENT_STATE'));
legacy=checkInvariants({idempotency_keys:['a','a']});
assert(legacy.violations.includes('DUPLICATE_IDEMPOTENCY_KEY'));
legacy=checkInvariants({production_status:'PRODUCTION_GREEN',exact_production_sha:'',verified_production:false});
assert(legacy.violations.includes('INVALID_PRODUCTION_GREEN'));
legacy=checkInvariants({heartbeat_age_minutes:70,max_heartbeat_minutes:60});
assert(legacy.violations.includes('MISSING_HEARTBEAT'));

const now='2026-08-28T21:10:00.000Z';
const base=[
 {id:'hb1',type:'HEARTBEAT',created_at:'2026-08-28T21:05:00.000Z'},
 {id:'e1',object_type:'Evidence',trace_id:'t1'},
 {id:'s1',object_type:'Signal',trace_id:'t1',parent_refs:['e1']},
 {id:'o1',object_type:'Opportunity',trace_id:'t1',parent_refs:['s1']},
 {id:'d1',object_type:'Decision',trace_id:'t1',parent_refs:['o1']},
 {id:'m1',object_type:'Mission',trace_id:'t1',parent_refs:['d1'],status:'RECOVERING'},
 {id:'out1',object_type:'Outcome',trace_id:'t1',mission_id:'m1',parent_refs:['m1']}
];
assert.equal(checkInvariants({events:base,now}).healthy,true);

let r=checkInvariants({events:base.filter(e=>e.id!=='out1'),now});
assert(r.violations.some(v=>v.code==='TRACE_MISSING_OUTCOME'));
r=checkInvariants({events:[...base,{id:'x1',object_type:'Signal',idempotency_key:'dup'},{id:'x2',object_type:'Signal',idempotency_key:'dup'}],now});
assert(r.violations.some(v=>v.code==='DUPLICATE_IDEMPOTENCY_KEY'));
r=checkInvariants({events:[...base,{id:'x3',object_type:'Signal',parent_refs:['missing']}],now});
assert(r.violations.some(v=>v.code==='BROKEN_PARENT_LINEAGE'));
r=checkInvariants({events:[...base,{id:'m2',object_type:'Mission',trace_id:'t2',status:'PRODUCTION_GREEN',production_sha:'abc',production_verified:false}],now});
assert(r.violations.some(v=>v.code==='INVALID_PRODUCTION_GREEN'));
r=checkInvariants({events:base,currentStates:[{entity_ref:'prod',state_type:'deploy',last_verified_at:'2026-08-28T19:00:00.000Z',max_age_ms:3600000}],now});
assert(r.violations.some(v=>v.code==='STALE_CURRENT_STATE'));
r=checkInvariants({events:base.filter(e=>e.type!=='HEARTBEAT'),now});
assert(r.violations.some(v=>v.code==='MISSING_HEARTBEAT'));
assert.equal(r.recovery_signals.length,r.violations.length);
console.log('PASS observability catches silent trace, state, identity and heartbeat failures');
