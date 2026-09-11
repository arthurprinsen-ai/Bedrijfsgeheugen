import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(dir) { const out=[]; for (const entry of await readdir(dir,{withFileTypes:true})) { const path=join(dir,entry.name); if (entry.isDirectory()) out.push(...await walk(path)); else if (/\.(?:m?js|cjs)$/.test(entry.name)) out.push(path); } return out; }

test('all literal Supabase migration references in tests and Brain scripts resolve to files in the canonical ledger', async () => {
  const files=[...await walk('tests'),...await walk('scripts/brain')];
  const missing=[];
  for (const file of files) {
    const text=await readFile(file,'utf8');
    for (const match of text.matchAll(/supabase\/migrations\/([0-9][A-Za-z0-9_-]*\.sql)/g)) {
      const migration=`supabase/migrations/${match[1]}`;
      try { await access(migration); } catch { missing.push(`${file} -> ${migration}`); }
    }
  }
  assert.deepEqual(missing,[],`stale migration references:\n${missing.join('\n')}`);
});
