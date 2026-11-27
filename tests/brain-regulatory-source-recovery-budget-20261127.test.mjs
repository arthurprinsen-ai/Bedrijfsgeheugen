import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const yaml=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
const start=yaml.indexOf('                # A body-only correction cannot create missing files');
const end=yaml.indexOf('                admission_failed=0',start);
assert.ok(start>=0&&end>start);
const block=yaml.slice(start,end);
const sha='a'.repeat(40);
function simulate(body,pr,files){
 const r=spawnSync('bash',['-c',`set -euo pipefail\nrepo=example/repo; number=6201; head=$TEST_HEAD; body=$TEST_BODY; compare_json=$TEST_COMPARE\ngh(){ printf '%s' "$TEST_PR"; }\nfor candidate in one; do\n${block}\necho RETRY_ELIGIBLE_FOR_EXISTING_GATES\ndone`],{encoding:'utf8',env:{...process.env,TEST_HEAD:sha,TEST_BODY:body,TEST_PR:JSON.stringify(pr),TEST_COMPARE:JSON.stringify({files})}});
 assert.equal(r.status,0,r.stderr);return r.stdout;
}
const body='Regulatory-Candidate-Type: source-observation';
const pr={state:'open',head:{sha},changed_files:1};
const files=[{filename:'data/regulatory-source-state.json'}];
test('exact incomplete source projection cannot consume retry budget',()=>{const out=simulate(body,pr,files);assert.match(out,/REGULATORY_SOURCE_CLOSURE_OWNER_REQUIRED/);assert.doesNotMatch(out,/RETRY_ELIGIBLE/)});
test('unrelated PR, head drift, closed state or incomplete provider evidence do not assert the narrow classification',()=>{for(const [b,p,f] of [['other',pr,files],[body,{...pr,head:{sha:'b'.repeat(40)}},files],[body,{...pr,state:'closed'},files],[body,{},files],[body,pr,[]],[body,pr,[{filename:'other'}]]])assert.match(simulate(b,p,f),/RETRY_ELIGIBLE/)});
test('actual multi-file recovery successor is not suppressed by one-path guard',()=>{assert.match(simulate(body,{...pr,changed_files:4},[...files,{filename:'brain/learning/test.json'},{filename:'docs/changes/test.md'},{filename:'docs/development-ledger-events/test.md'}]),/RETRY_ELIGIBLE/)});
