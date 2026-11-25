import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const path=resolve(import.meta.dirname,'../supabase/migrations');
const expected=["20261014130614","20261014133344","20261014140905","20261014144228","20261014162635","20261014163411","20261014163916","20261014191753","20261014193133","20261014195237"];
test('all ten remaining recorded production migration versions are tracked in this batch',()=>{
 const names=readdirSync(path).filter(x=>x.endsWith('.sql'));
 for(const v of expected){
  const matches=names.filter(x=>x.startsWith(v+'_'));
  assert.equal(matches.length,1,v);
  assert.ok(readFileSync(join(path,matches[0]),'utf8').trim().length>10,v);
 }
});


test('last ten production versions consist of seven newly restored and three existing main SQL records', () => {
 const added = ['20261014130614','20261014133344','20261014140905','20261014144228','20261014162635','20261014163411','20261014163916'];
 const existing = ['20261014191753','20261014193133','20261014195237'];
 assert.equal(added.length,7);
 assert.equal(existing.length,3);
 assert.deepEqual([...added,...existing],expected);
 const gate = readFileSync(new URL('../scripts/brain/check_powerhouse_supabase_security.py',import.meta.url),'utf8');
 assert.match(gate,/20261014162635_restore_runtime_mux_statement_timeout_20261014\.sql/);
 assert.match(gate,/9609cd69f89dbe746bd36b96b8bb7c0aaeca38f7/);
});
