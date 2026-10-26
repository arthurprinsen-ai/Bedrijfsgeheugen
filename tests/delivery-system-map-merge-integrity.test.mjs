import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const guard = 'tools/delivery/assert-system-map-integrity.mjs';
test('System Map guard fails closed without generator identity', () => {
 const result=spawnSync(process.execPath,[guard],{encoding:'utf8',env:{...process.env,SYSTEM_MAP_GENERATE_COMMAND:'',SYSTEM_MAP_PATH:''}});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/SYSTEM_MAP_INTEGRITY_FAIL/);
});
test('System Map guard rejects untracked canonical artifact', () => {
 const result=spawnSync(process.execPath,[guard],{encoding:'utf8',env:{...process.env,SYSTEM_MAP_GENERATE_COMMAND:'node --version',SYSTEM_MAP_PATH:'not-a-tracked-map.mjs'}});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/not tracked/);
});
test('System Map guard rejects unsafe generator arguments', () => {
 const result=spawnSync(process.execPath,[guard],{encoding:'utf8',env:{...process.env,SYSTEM_MAP_GENERATE_COMMAND:'node;echo unsafe',SYSTEM_MAP_PATH:'platform/system-map/canonical-system-map.mjs'}});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/literal vetted/);
});
