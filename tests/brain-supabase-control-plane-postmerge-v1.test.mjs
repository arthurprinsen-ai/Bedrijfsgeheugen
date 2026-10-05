import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const applicability=await readFile('.github/workflows/supabase-preview-applicability.yml','utf8');
const repair=await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

test('Supabase preview applicability uses bounded file transport and preserves exact provider proof',()=>{
  assert.match(applicability,/payload_file="\$\(mktemp\)"/);
  assert.match(applicability,/-o "\$payload_file"/);
  assert.match(applicability,/PAYLOAD_FILE="\$payload_file" node --input-type=module/);
  assert.match(applicability,/readFileSync\(process\.env\.PAYLOAD_FILE,'utf8'\)/);
  assert.doesNotMatch(applicability,/PAYLOAD="\$payload"/);
  assert.match(applicability,/c\?\.name==='Supabase Preview' && c\?\.app\?\.slug==='supabase'/);
  assert.match(applicability,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
  assert.match(applicability,/SUPABASE_PREVIEW_PROVIDER_NON_PROOF/);
});

test('supported migration repair records immutable preflight evidence before credential validation',()=>{
  const evidenceIndex=repair.indexOf("repair-evidence/preflight.json");
  const accessTokenIndex=repair.indexOf('SUPABASE_ACCESS_TOKEN missing');
  assert.ok(evidenceIndex>=0,'repair preflight evidence must exist');
  assert.ok(accessTokenIndex>=0,'credential fail-closed guard must exist');
  assert.ok(evidenceIndex<accessTokenIndex,'repair evidence must be materialized before credential validation');
  assert.match(repair,/production_effect_evidence_verified:true/);
  assert.match(repair,/direct_schema_migrations_writes_forbidden:true/);
  assert.match(repair,/supabase migration repair[\s\S]*20261005133951[\s\S]*--status applied/);
  assert.doesNotMatch(repair,/insert\s+into\s+supabase_migrations/i);
});
