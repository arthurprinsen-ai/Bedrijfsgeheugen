import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import './brain-bedrijfslek-canonical-brain-v1.test.mjs';
import './brain-commercial-hourly-stage-isolation-v1.test.mjs';
import './brain-commercial-outcome-kpi-truth-v1.test.mjs';
import './brain-contact-authority-review-v1.test.mjs';
import './brain-decision-evidence-normalization.test.mjs';
// The migrated SQL, not a test-only substitute, is the exact oracle source.
const sources=[
  {
    "testPath": "tests/brain-bedrijfslek-canonical-brain-v1.test.mjs",
    "oldPath": "supabase/migrations/20261009185500_bedrijfslek_runtime_signal_cycle_v1.sql",
    "currentPath": "supabase/migrations/20261009190719_bedrijfslek_runtime_signal_cycle_v1.sql",
    "originalTestBlob": "6085a84ceb07c4a682399e9a57a1d67f0190807c",
    "canonicalSqlBlob": "c45901a1e162cb8936508018abc02416ad268364"
  },
  {
    "testPath": "tests/brain-commercial-hourly-stage-isolation-v1.test.mjs",
    "oldPath": "supabase/migrations/20261011171500_powerhouse_commercial_isolated_hourly_stages_v1.sql",
    "currentPath": "supabase/migrations/20261011122630_powerhouse_commercial_isolated_hourly_stages_v1.sql",
    "originalTestBlob": "849423e375102dd4f5f57f5faf5f935da672e976",
    "canonicalSqlBlob": "7ed8a4c25c26f90ad9ab846ba1571fb1427041a7"
  },
  {
    "testPath": "tests/brain-commercial-outcome-kpi-truth-v1.test.mjs",
    "oldPath": "supabase/migrations/20261009193000_filter_real_commercial_outcome_kpis_v1.sql",
    "currentPath": "supabase/migrations/20261009161226_filter_real_commercial_outcome_kpis_v1.sql",
    "originalTestBlob": "bcc6857147d9980e0ce32dacc47de82e64f5f569",
    "canonicalSqlBlob": "f8ae5182cc727f8624b9d0527b1b72dc89fefb81"
  },
  {
    "testPath": "tests/brain-contact-authority-review-v1.test.mjs",
    "oldPath": "supabase/migrations/20261013160000_powerhouse_canonical_contact_authority_review_v1.sql",
    "currentPath": "supabase/migrations/20261013145222_powerhouse_canonical_contact_authority_review_v1.sql",
    "originalTestBlob": "f04530155f9d27e3045a67bbd16e89e8f7279193",
    "canonicalSqlBlob": "3e92d939ba74f269feefec75ab627ed381a9085f"
  },
  {
    "testPath": "tests/brain-decision-evidence-normalization.test.mjs",
    "oldPath": "supabase/migrations/20261011120000_powerhouse_decision_evidence_json_normalize_v1.sql",
    "currentPath": "supabase/migrations/20261011091426_powerhouse_decision_evidence_json_normalize_v1.sql",
    "originalTestBlob": "a4e061e413fd89d585c30e253c97bfe32d20043c",
    "canonicalSqlBlob": "206cdbbd92798810bf640bdff000cd3c1831f814"
  }
];
function gitSha(content){const bytes=Buffer.from(content,'utf8');return createHash('sha1').update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex');}
for(const s of sources){test('canonical nonempty SQL and original BRAIN contract: '+s.currentPath,()=>{
  assert.equal(existsSync(s.oldPath),false,'Do not add a duplicate executable migration');
  assert.equal(existsSync(s.currentPath),true,'Canonical executable migration must exist');
  const sql=readFileSync(s.currentPath,'utf8');assert.ok(sql.trim().length>0);
  assert.equal(gitSha(sql),s.canonicalSqlBlob,'Immutable canonical SQL source changed');
  const source=readFileSync(s.testPath,'utf8');
  assert.ok(source.includes(s.currentPath));assert.ok(!source.includes(s.oldPath));
  assert.equal(gitSha(source.replaceAll(s.currentPath,s.oldPath)),s.originalTestBlob,'Original test changed outside source-path correction');
});}
