import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const yaml=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');

test('recovery supervisor is a single YAML document and never embeds itself in metadata regex',()=>{
  const count=needle=>yaml.split(needle).length-1;
  assert.equal(count('# Queue-storm guard v1: bounded recovery, repository backpressure, no main-push fan-out'),1);
  assert.equal(count('name: Powerhouse Delivery Recovery Supervisor'),1);
  assert.equal(count('\njobs:\n'),1);
  assert.equal(count('const replaceOne=(text,label,value)=>{'),1);
  assert.doesNotMatch(yaml,/const re=new RegExp\(\`\^\$\{label\}:\.\*# Queue-storm guard/);
});

test('same-lineage refresh updates only exact metadata lines',()=>{
  assert.match(yaml,/const re=new RegExp\(\`\^\$\{label\}:\.\*\$\`,'m'\)/);
  assert.match(yaml,/replaceOne\(body,'Writer-Lease-State','TERMINAL_DELIVERY'\)/);
  assert.match(yaml,/replaceOne\(next,'Base-SHA',process\.env\.NEW_MAIN\)/);
  assert.match(yaml,/replaceOne\(next,'Writer-Lease-Head',process\.env\.NEW_HEAD\)/);
  assert.match(yaml,/replaceOne\(next,'Writer-Lease-Main-Epoch',process\.env\.NEW_MAIN\)/);
  assert.match(yaml,/--method PATCH "repos\/\$repo\/pulls\/\$number"/);
});


test('metadata-only correction after failed admission gets one bounded exact-head redispatch',()=>{
  assert.match(yaml,/FAILED_GATE_RECOVERY\)/);
  assert.match(yaml,/hygiene \/ admission/);
  assert.match(yaml,/lease_head\" != \"\$head/);
  assert.match(yaml,/pr_updated_epoch/);
  assert.match(yaml,/required_updated_epoch/);
  assert.match(yaml,/metadata changed after failed admission; redispatching exact-head Required once/);
  assert.match(yaml,/corrected metadata already has an active Required; duplicate redispatch suppressed/);
  assert.match(yaml,/failed gate has no newer metadata-only correction; no automatic retry/);
});
