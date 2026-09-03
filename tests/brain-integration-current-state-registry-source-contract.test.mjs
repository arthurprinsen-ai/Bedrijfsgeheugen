import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { listIntegrationCurrentStateAdapters } from '../brain/operating-loop/integration-current-state-registry.mjs';

test('every CurrentState-capable source mapping has exactly one registered integration adapter',async()=>{
  const config=JSON.parse(await readFile(new URL('../config/brain-source-mappings.json',import.meta.url),'utf8'));
  const mapped=Object.entries(config.sources||{})
    .filter(([,source])=>Array.isArray(source.canonical_types)&&source.canonical_types.includes('CurrentState'))
    .map(([name])=>name)
    .sort();
  assert.deepEqual(listIntegrationCurrentStateAdapters(),mapped);
});

test('every registered integration source preserves raw evidence and fails closed through the global source contract',async()=>{
  const config=JSON.parse(await readFile(new URL('../config/brain-source-mappings.json',import.meta.url),'utf8'));
  assert.equal(config.default_unknown_source,'fail_closed');
  for(const source of listIntegrationCurrentStateAdapters()){
    assert.equal(config.sources[source]?.preserve_raw,true,`${source} must preserve raw source evidence`);
    assert.ok(Array.isArray(config.sources[source]?.identity_fields)&&config.sources[source].identity_fields.length>0,`${source} must declare identity fields`);
    assert.ok(String(config.sources[source]?.freshness_field||'').length>0,`${source} must declare freshness`);
  }
});
