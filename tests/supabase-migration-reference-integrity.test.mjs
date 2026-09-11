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
