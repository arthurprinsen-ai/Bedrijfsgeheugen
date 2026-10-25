#!/usr/bin/env node
// Read-only SQL test oracle preflight. No schema changes or migration repair.
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { existsSync } from 'node:fs';

const root=resolve(import.meta.dirname,'../..');
const testDir=join(root,'tests');
const active=join(root,'supabase/migrations');
const archive=join(root,'supabase/migration-history/repository-only');
async function files(dir) {
  if(!existsSync(dir)) return [];
  const entries=await readdir(dir,{withFileTypes:true});
  const nested=await Promise.all(entries.map(async e=>e.isDirectory()?files(join(dir,e.name)):e.isFile()?[join(dir,e.name)]:[]));
  return nested.flat();
}
export async function audit(){
  const candidates=(await files(testDir)).filter(f=>f.endsWith('.test.mjs'));
  const retired=await files(archive);
  const archived=new Map();
  for(const f of retired.filter(f=>f.endsWith('.sql'))){
    const name=basename(f); const matches=archived.get(name)||[]; matches.push(f); archived.set(name,matches);
  }
  const failures=[];
  for(const file of candidates){
    const src=await readFile(file,'utf8');
    const re=/supabase\\/migrations\\/([A-Za-z0-9_.-]+\\.sql)/g;
    for(const m of src.matchAll(re)){
      const name=m[1], original=join(active,name);
      if(existsSync(original)) continue;
      const matches=archived.get(name)||[];
      const nonempty=[];
      for(const path of matches){
        if((await readFile(path,'utf8')).trim()) nonempty.push(path.slice(root.length+1));
      }
      failures.push({test:file.slice(root.length+1),migration:name,reason:nonempty.length===1?'RETIRED_SQL_REFERENCE':nonempty.length>1?'AMBIGUOUS_ARCHIVE_SOURCE':'MISSING_SQL_SOURCE',archive_candidates:nonempty});
    }
  }
  return {tests_scanned:candidates.length,unresolved_references:failures.length,failures};
}
if(process.argv[1] && resolve(process.argv[1])===resolve(import.meta.filename)){
  const result=await audit();
  process.stdout.write(JSON.stringify(result,null,2)+'\\n');
  if(result.unresolved_references) process.exitCode=1;
}
