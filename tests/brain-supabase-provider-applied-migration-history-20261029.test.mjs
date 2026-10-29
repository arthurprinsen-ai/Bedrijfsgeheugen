import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sources=[
 ['20261028212459','bg_bedrijfsprofiel_v1','e749a0d8bcbf168a28355b9e9c9f7770'],
 ['20261029101146','personal_observational_source_date_gate_20261029','014b86182dfd2f5493f545e4ec51f741'],
 ['20261029101159','linkedin_personal_observational_source_freshness_20261029','014b86182dfd2f5493f545e4ec51f741']
];
const read=(version,name)=>readFileSync(new URL('../supabase/migrations/'+version+'_'+name+'.sql',import.meta.url),'utf8');

test('all three remote-applied history versions are mirrored byte-for-byte from provider statements',()=>{
  const filenames=readdirSync(new URL('../supabase/migrations/',import.meta.url));
  for(const [version,name,expectedMd5] of sources){
    const filename=version+'_'+name+'.sql';
    assert.equal(filenames.filter(f=>f.startsWith(version+'_')).length,1,'unique version '+version);
    assert.ok(filenames.includes(filename));
    assert.equal(createHash('md5').update(read(version,name)).digest('hex'),expectedMd5,'provider SQL checksum mismatch '+version);
  }
});
test('same applied SQL at two distinct timestamps is recorded accurately without fabricating a new migration',()=>{
  assert.equal(read(...sources[1]),read(...sources[2]));
  assert.match(read(...sources[1]),/source_published_at::date between \(p_date - 45\) and p_date/i);
  assert.match(read(...sources[1]),/revoke execute on function public\.powerhouse_ensure_personal_source_rotation_v2\(date\) from public, anon, authenticated/i);
  assert.match(read(...sources[2]),/grant execute on function public\.powerhouse_ensure_personal_source_rotation_v2\(date\) to service_role, postgres/i);
});
test('business profile migration retains explicit RLS and service role only',()=>{
  const sql=read(...sources[0]);
  assert.match(sql,/alter table public\.bg_bedrijfsprofiel enable row level security/i);
  assert.match(sql,/revoke all on public\.bg_bedrijfsprofiel from public, anon, authenticated/i);
  assert.match(sql,/grant select, insert, update on public\.bg_bedrijfsprofiel to service_role/i);
  assert.match(sql,/revoke all on function public\.bg_bedrijven_voor_profiel\(integer\) from public, anon, authenticated/i);
});
test('historical local-only LinkedIn workflow migration remains intact; no production history manipulation',()=>{
  const filename='20261028220000_bg_linkedin_lus_v1.sql';
  assert.ok(readdirSync(new URL('../supabase/migrations/',import.meta.url)).includes(filename));
  assert.match(readFileSync(new URL('../supabase/migrations/'+filename,import.meta.url),'utf8'),/create table if not exists public\.bg_linkedin_bewijs/i);
});
