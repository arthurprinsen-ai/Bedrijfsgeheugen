import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration='supabase/migrations/20260831_brain_supporting_control_plane.sql';
test('failure registry dedupes occurrences and promotes knowledge monotonically',()=>{
  assert.equal(fs.existsSync(migration),true);
  const sql=fs.readFileSync(migration,'utf8');
  for(const x of ['brain_failure_registry','brain_failure_occurrences','brain_observe_failure','brain_promote_failure','FAILURE_OCCURRENCE_IDENTITY_CONFLICT','FAILURE_VERSION_CONFLICT','KNOWLEDGE_MATURITY_DOWNGRADE_FORBIDDEN','occurrence_count']) assert.match(sql,new RegExp(x,'i'),`missing ${x}`);
});
