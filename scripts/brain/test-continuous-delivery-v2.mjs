import assert from 'node:assert/strict';
import {evaluateDeliveryLane, scopesConflict, validateDeliveryManifest} from '../../brain/production/continuous-delivery-v2.mjs';

const base={
  contract:'BRAIN-DELIVERY-v2',
  change_id:'change-1',
  component_id:'website',
  lane_id:'website:change-1',
  component_type:'app',
  candidate_identity:'abc123',
  tested_identity:'abc123',
  registered:true,
  brain_context_loaded:true,
  learning_writeback_configured:true,
  rollback_identity:'lkg123',
  gates:{contract:true,quality:true,security:true,cost_performance:true,preview:true},
  dependencies:[],
  scopes:['apps/website/**'],
  production:{status:'PENDING',deployed_identity:''}
};

assert.deepEqual(validateDeliveryManifest(base),{ok:true,errors:[]});
assert.equal(scopesConflict(['apps/website/**'],['apps/portal/**']),false,'independent scopes may deliver simultaneously');
assert.equal(scopesConflict(['brain/contracts/**'],['brain/contracts/**']),true,'same scope conflicts');
assert.equal(scopesConflict(['brain/**'],['brain/contracts/**']),true,'parent scope conflicts');

assert.deepEqual(evaluateDeliveryLane(base),{decision:'PROMOTION_READY',reason:'lane_green',candidate_identity:'abc123',rollback_identity:'lkg123'});
assert.equal(evaluateDeliveryLane({...base,tested_identity:'def456'}).decision,'RECOVERING','untested identity may not promote');
assert.equal(evaluateDeliveryLane({...base,registered:false}).reason,'component_not_registered');
assert.equal(evaluateDeliveryLane({...base,brain_context_loaded:false}).reason,'brain_context_missing');
assert.equal(evaluateDeliveryLane({...base,learning_writeback_configured:false}).reason,'learning_writeback_missing');
assert.equal(evaluateDeliveryLane({...base,gates:{...base.gates,security:false}}).reason,'security_gate_red');
assert.equal(evaluateDeliveryLane({...base,rollback_identity:''}).reason,'rollback_missing');
assert.deepEqual(evaluateDeliveryLane({...base,production:{status:'GREEN',deployed_identity:'abc123'}}),{decision:'PRODUCTION_GREEN',reason:'exact_production_identity_verified',candidate_identity:'abc123'});
assert.equal(evaluateDeliveryLane({...base,production:{status:'GREEN',deployed_identity:'wrong'}}).decision,'ROLLBACK','wrong deployed identity must rollback');

const missing={...base,component_id:''};
assert.equal(validateDeliveryManifest(missing).ok,false);
assert.ok(validateDeliveryManifest(missing).errors.includes('component_id'));

console.log('PASS BRAIN continuous delivery v2 invariants');
