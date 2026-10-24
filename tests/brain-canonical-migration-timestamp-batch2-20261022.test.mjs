import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Original suites remain enabled in the complete backend BRAIN; this is source identity admission only.
const sources=[
  {
    "testPath": "tests/brain-real-commercial-conversion-truth-v1.test.mjs",
    "oldPath": "supabase/migrations/20261009190000_fix_noncommercial_conversion_projection_v1.sql",
    "currentPath": "supabase/migrations/20261009155535_fix_noncommercial_conversion_projection_v1.sql",
    "originalTestBlob": "8f728de935a43ff897512e246fb7653b99573289",
    "canonicalSqlBlob": "96da76180829bd011b9c331b481ed07594c1c678"
  },
  {
    "testPath": "tests/brain-salesrobot-provider-proof-daily-assurance-v1.test.mjs",
    "oldPath": "supabase/migrations/20261009160500_salesrobot_provider_proof_daily_assurance_v1.sql",
    "currentPath": "supabase/migrations/20261009141054_salesrobot_provider_proof_daily_assurance_v1.sql",
    "originalTestBlob": "d3135dfdac5284e8930f445c728dae1b11c173f0",
    "canonicalSqlBlob": "8a0f1020c5b07ea6a34165fc2a035c8161b6fc86"
  },
  {
    "testPath": "tests/brain-powerhouse-growth-plays-20of20-v1.test.mjs",
    "oldPath": "supabase/migrations/20260928162600_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql",
    "currentPath": "supabase/migrations/20260928140907_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql",
    "originalTestBlob": "35c42f32229638f57c8a7e1231b8dad80296c18c",
    "canonicalSqlBlob": "08df171c6d4b340c69fda68338e18020f0468422"
  },
  {
    "testPath": "tests/brain-powerhouse-persuasion-revenue-optimizer-v1.test.mjs",
    "oldPath": "supabase/migrations/20260928152400_powerhouse_persuasion_revenue_optimizer_v1.sql",
    "currentPath": "supabase/migrations/20260928133343_powerhouse_persuasion_revenue_optimizer_v1.sql",
    "originalTestBlob": "249f9de3d82931e8f905c60419d1491cf0559af0",
    "canonicalSqlBlob": "d38a9b83f34b3bab104289b28d38c73fdb573004"
  },
  {
    "testPath": "tests/brain-outreach-4340-canonical-quality.test.mjs",
    "oldPath": "supabase/migrations/20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql",
    "currentPath": "supabase/migrations/20261012074151_20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql",
    "originalTestBlob": "9578814d03933ecb3e97ac4fc0c6e6a460e5bdd2",
    "canonicalSqlBlob": "135a2a08eddfed78aa1e888e8f697ec9edbee34d"
  },
  {
    "testPath": "tests/brain-powerhouse-mira-public-complaint-source-loop-v1.test.mjs",
    "oldPath": "supabase/migrations/20260929201000_powerhouse_mira_public_complaint_source_loop_v1.sql",
    "currentPath": "supabase/migrations/20260929183956_powerhouse_mira_public_complaint_source_loop_v1.sql",
    "originalTestBlob": "d32945bae2ebf56ae8cc4c889d069b7a7395ced0",
    "canonicalSqlBlob": "113b3cd976d74bcccd748e8bb2ef0c3f48c84509"
  }
];
const gitSha=x=>{const b=Buffer.from(x,'utf8');return createHash('sha1').update('blob '+b.length+String.fromCharCode(0)).update(b).digest('hex');};
for(const s of sources)test('BRAIN source oracle reads immutable real migration: '+s.currentPath,()=>{
 assert.equal(existsSync(s.oldPath),false,'Do not restore duplicate planned-timestamp migrations');
 assert.equal(existsSync(s.currentPath),true);
 const sql=readFileSync(s.currentPath,'utf8');assert.ok(sql.trim().length>0);
 assert.equal(gitSha(sql),s.canonicalSqlBlob);
 const text=readFileSync(s.testPath,'utf8');assert.ok(text.includes(s.currentPath));assert.ok(!text.includes(s.oldPath));
 assert.equal(gitSha(text.replace(s.currentPath,s.oldPath)),s.originalTestBlob,'Original positive/negative assertions must stay byte-identical');
});
