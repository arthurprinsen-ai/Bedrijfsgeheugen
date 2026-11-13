import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const get=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const history=JSON.parse(get('supabase/migration-history.lock.json'));
const terminalSql=get('supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql');

test('original native provider 843 version and name remains one immutable append with 842 history prefix',()=>{
  const ids=history.applied.map(x=>x.version);
  assert.equal(new Set(ids).size,ids.length,'no original migration identities may be duplicated');
  const pos=ids.indexOf('20261113083000');
  assert.ok(pos>=842,'original verified 843 identity cannot overwrite 842-provider history');
  assert.deepEqual(history.applied[pos],{version:'20261113083000',name:'original_one_chain_content_terminal_proof_guard_v1'});
  assert.equal(history.applied[pos-1].version,'20261113082500','original cancelled social learning ACK retained');
  assert.match(history.captured_at,/^2026-11-13T/);
});
test('the one source lock records the real original INVOKER terminal guard, not an invented migration',()=>{
 assert.match(terminalSql,/CREATE OR REPLACE FUNCTION public\.brain_guard_content_terminal_proof_v1\(\)/);
 assert.match(terminalSql,/SECURITY INVOKER/);
 assert.match(terminalSql,/CREATE TRIGGER brain_content_handoff_terminal_proof_guard_v1/);
 assert.match(terminalSql,/BEFORE INSERT OR UPDATE/);
 assert.doesNotMatch(terminalSql,/SECURITY DEFINER/);
});
