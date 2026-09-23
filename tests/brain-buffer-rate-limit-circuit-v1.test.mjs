import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');

test('Buffer 429 opens a persistent circuit and preserves LinkedIn content_ready',()=>{
  assert.match(source,/BUFFER_CIRCUIT_RECORD='buffer-rate-limit-circuit-v1'/);
  assert.match(source,/openBufferCircuit/);
  assert.match(source,/buffer_retry_at/);
  assert.match(source,/BUFFER_RATE_LIMITED/);
  assert.match(source,/record_type:'CurrentState',record_kind:'current_state'/);
  assert.doesNotMatch(source,/record_type:'RuntimeState'|record_kind:'runtime_state'/);
  assert.match(source,/state:'content_ready'/);
  assert.match(source,/deferred_rate_limit/);
});

test('open Buffer circuit never blocks personal LinkedIn direct transport',()=>{
  assert.match(source,/if \(!bufferCircuit\.active && bufferToken\)/);
  assert.match(source,/BUFFER_RATE_LIMIT_CIRCUIT_OPEN/);
  assert.match(source,/row\.channel === 'linkedin_company' && bufferCircuit\.active/);
  assert.doesNotMatch(source,/\['linkedin_personal','linkedin_company'\]\.includes\(row\.channel\) && bufferCircuit\.active/);
  assert.match(source,/publishLinkedInPersonalViaComposio/);
  assert.match(source,/LINKEDIN_CREATE_LINKED_IN_POST/);
  assert.match(source,/LINKEDIN_GET_POST_CONTENT/);
  assert.match(source,/transport_contract:'linkedin-composio-direct-v1'/);
  assert.match(source,/buffer_dependency:false/);
  assert.match(source,/readLinkedInPersonalPostViaComposio/);
  assert.match(source,/row\.channel === 'linkedin_personal' && \(declaredProvider === 'linkedin_direct' \|\| \/\^urn:li:/);
  assert.match(source,/COMPOSIO_LINKEDIN_EXACT_RECONCILE_MISMATCH/);
  assert.match(source,/never route this claim through Buffer or create a replacement post/);
  assert.match(source,/publishInstagramViaComposio/);
});
