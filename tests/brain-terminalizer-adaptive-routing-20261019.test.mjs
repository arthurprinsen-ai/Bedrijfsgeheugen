import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyTerminalReleaseScope,isMigrationAndNonRuntimeScope} from '../tools/delivery/terminal-release-scope.mjs';
const config='config/powerhouse-adaptive-delivery-v1.json';
test('adaptive regression routing alone has no deployed runtime',()=>{
 assert.deepEqual(classifyTerminalReleaseScope([config]),{website:false,edge:false,other:false,non_runtime:true});
});
test('mixed predictive release still requires real Edge and migration readback',()=>{
 const engine='supabase/functions/powerhouse-predictive-engine/index.ts';
 assert.deepEqual(classifyTerminalReleaseScope([config,engine]),{website:false,edge:true,other:false,non_runtime:false});
 const migration='supabase/migrations/20261019194349_predictive_public_market_calibration_due_v1.sql';
 assert.equal(isMigrationAndNonRuntimeScope([config,migration]),true);
 assert.equal(classifyTerminalReleaseScope([config,migration]).non_runtime,false);
});
test('unknown config runtime remains fail closed',()=>{
 assert.equal(classifyTerminalReleaseScope(['config/unknown-runtime.json']).other,true);
 assert.equal(isMigrationAndNonRuntimeScope(['config/unknown-runtime.json','supabase/migrations/20261019194349_predictive_public_market_calibration_due_v1.sql']),false);
});
