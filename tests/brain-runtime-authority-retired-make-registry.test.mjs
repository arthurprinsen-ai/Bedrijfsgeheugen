import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('component registry cannot reactivate retired Make PH agents', async () => {
  const registry=JSON.parse(await readFile('docs/brain/component-registry.json','utf8'));
  const authority=JSON.parse(await readFile('config/powerhouse-runtime-authority.json','utf8'));
  assert.equal(registry.source_authority_version, authority.version);
  assert.equal(registry.source_authority_fingerprint, authority.fingerprint);
  const retired=new Set(authority.components.find(c=>c.id==='make-powerhouse-legacy-estate').known_retired_agents.map((_,i)=>`PH_AGENT_${String(i+1).padStart(2,'0')}`));
  for (const c of registry.components.filter(c=>retired.has(c.key))) {
    assert.equal(c.runtime,'make');
    assert.equal(c.status,'legacy_retired_path');
    assert.equal(c.authority,'NONE');
    assert.equal(c.production_execution_allowed,false);
  }
  assert.equal(registry.components.filter(c=>retired.has(c.key)).length, retired.size);
});
