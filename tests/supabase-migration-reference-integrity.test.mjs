import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(dir) {
  const out=[];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const path=join(dir,entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (/\.(?:m?js|cjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}

function referencedMigrations(text) {
  const refs=new Set();
  // Negative assertions (a retired migration must stay absent) do not read the file.
  text=text.replace(/assert\.equal\(\s*existsSync\(\s*new URL\(\s*(['"])[^'"]+\1\s*,\s*import\.meta\.url\s*\)\s*\)\s*,\s*false\s*\)\s*;?/g,'');
  text=text.replace(/assert\.equal\(\s*existsSync\([^)]*\)\s*,\s*false/g,'');
  const patterns=[
    /(?:readFile|readFileSync|existsSync|access)\s*\(\s*(?:new URL\(\s*)?['"](?:\.\.\/)?(supabase\/migrations\/[0-9][A-Za-z0-9_-]*\.sql)/g,
    /(?:const|let)\s+(?:migration(?:Path|Url)?|hardening(?:Path)?|sqlPath)\s*=\s*(?:new URL\(\s*)?['"](?:\.\.\/)?(supabase\/migrations\/[0-9][A-Za-z0-9_-]*\.sql)/gi,
  ];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) refs.add(match[1]);
  return [...refs];
}

test('migration files actually read by tests and Brain scripts resolve to canonical ledger files', async () => {
  const files=[...await walk('tests'),...await walk('scripts/brain')];
  const missing=[];
  for (const file of files) {
    const text=await readFile(file,'utf8');
    for (const migration of referencedMigrations(text)) {
      try { await access(migration); } catch { missing.push(`${file} -> ${migration}`); }
    }
  }
  assert.deepEqual(missing,[],`stale migration file references:\n${missing.join('\n')}`);
});

test('only explicitly asserted absent nested URL migrations are excluded; actual reads still fail closed',()=>{
  const retired='supabase/migrations/20261110140500_original_commercial_verified_research_resume_v1.sql';
  const negative=`assert.equal(existsSync(new URL('../${retired}',import.meta.url)),false);`;
  const realRead=`readFileSync(new URL('../${retired}',import.meta.url),'utf8')`;
  assert.deepEqual(referencedMigrations(negative),[],
    'a deliberate missing migration must not appear as a positive required source');
  assert.deepEqual(referencedMigrations(realRead),[retired],
    'an actual required SQL read must still be rejected when its file is absent');
});
