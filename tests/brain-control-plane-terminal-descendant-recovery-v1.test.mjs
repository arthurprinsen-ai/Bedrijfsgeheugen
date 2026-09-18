import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('central terminal closure owns descendant-safe recovery', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/PRODUCTION_DESCENDANT_READBACK_PROVEN/);
  assert.match(workflow,/descendant_live/);
  assert.match(workflow,/git merge-base --is-ancestor/);
  assert.match(workflow,/Terminal-Production-Readback:/);
});

test('real canonical readback failures do not downgrade into descendant recovery', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/if \[ "\$source_conclusion" != "cancelled" \]/);
  assert.match(workflow,/PRODUCTION_READBACK_FAILED/);
});

test('Edge terminal authority requires explicit verified descendant proof', async()=>{
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(edge,/\['canonical_run','descendant_live'\]/);
  assert.match(edge,/PRODUCTION_DEPLOY_ID_MISSING/);
  assert.match(edge,/PRODUCTION_DESCENDANT_READBACK_NOT_VERIFIED/);
  assert.match(edge,/production_observed_sha/);
});
