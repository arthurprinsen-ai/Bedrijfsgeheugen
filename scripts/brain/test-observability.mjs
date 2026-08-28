import {checkTrace,checkInvariants} from '../../brain/observability/invariants.mjs';
let r=checkTrace([{type:'Signal',trace_id:'t'},{type:'Mission',trace_id:'t'}]); if(!r.violations.includes('MISSING_OUTCOME')) throw new Error('missing outcome not detected');
r=checkInvariants({current_state_age_hours:30,max_state_age_hours:24}); if(!r.violations.includes('STALE_CURRENT_STATE')) throw new Error('stale state missed');
r=checkInvariants({idempotency_keys:['a','a']}); if(!r.violations.includes('DUPLICATE_IDEMPOTENCY_KEY')) throw new Error('duplicate key missed');
r=checkInvariants({production_status:'PRODUCTION_GREEN',exact_production_sha:'',verified_production:false}); if(!r.violations.includes('INVALID_PRODUCTION_GREEN')) throw new Error('invalid green missed');
r=checkInvariants({heartbeat_age_minutes:70,max_heartbeat_minutes:60}); if(!r.violations.includes('MISSING_HEARTBEAT')) throw new Error('heartbeat missed');
console.log('observability tests passed');
